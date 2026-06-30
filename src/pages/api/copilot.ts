import type { APIRoute } from 'astro';
import { runOfflineEngine, HIGH_CONFIDENCE, createContext } from '../../lib/copilot';
import type { ConvContext, OfflineAction } from '../../lib/copilot';
import { callGroq, groqConfigured, type GroqMessage } from '../../lib/groqClient';
import { clientIp, deriveIdent, guardPrompt, DAILY_LIMIT } from '../../lib/copilotGuard';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** Split engine/LLM actions into OS actions + an inline media kind. */
function splitActions(actions: any[]): { osActions: any[]; media?: 'photos' | 'reel' } {
  let media: 'photos' | 'reel' | undefined;
  const osActions: any[] = [];
  for (const a of actions || []) {
    if (a?.type === 'showMedia') {
      if (a.media === 'photos' || a.media === 'reel') media = a.media;
    } else if (a?.type === 'openWindow' || a?.type === 'openLink') {
      osActions.push(a);
    }
  }
  return { osActions, media };
}

/** Normalize an untrusted client-supplied conversational context. */
function sanitizeContext(raw: any): ConvContext {
  const ctx = createContext();
  if (raw && typeof raw === 'object') {
    if (raw.usedVariants && typeof raw.usedVariants === 'object') {
      for (const [k, v] of Object.entries(raw.usedVariants)) {
        if (Array.isArray(v)) ctx.usedVariants[k] = v.filter((n) => typeof n === 'number').slice(0, 12);
      }
    }
    if (typeof raw.turns === 'number') ctx.turns = Math.min(raw.turns, 10000);
    if (typeof raw.lastIntentId === 'string') ctx.lastIntentId = raw.lastIntentId.slice(0, 60);
    if (typeof raw.lastProjectId === 'string') ctx.lastProjectId = raw.lastProjectId.slice(0, 60);
    if (typeof raw.lastAppId === 'string') ctx.lastAppId = raw.lastAppId as any;
    if (typeof raw.lastTopic === 'string') ctx.lastTopic = raw.lastTopic.slice(0, 60);
    if (typeof raw.lastFacet === 'string') ctx.lastFacet = raw.lastFacet as any;
  }
  return ctx;
}

/**
 * Authoritative AI Copilot endpoint.
 *
 * Every prompt is gated here, server-side, keyed by a hash of IP + User-Agent
 * (see copilotGuard). The offline engine runs server-side first; the LLM is
 * only used when the engine is unsure and Groq is configured. This makes the
 * 3-prompt auth gate, 8/day cap, and burst limit impossible to bypass by
 * clearing cookies or localStorage.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: 'INVALID_JSON', message: 'Invalid request format' }, 400);
  }

  const input = typeof body?.input === 'string' ? body.input.trim() : '';
  if (!input) return json({ ok: false, code: 'INVALID_INPUT', message: 'Empty input' }, 400);
  if (input.length > 2000) {
    return json({ ok: false, code: 'INVALID_INPUT', message: 'Message too long' }, 400);
  }

  const ip = clientIp(request, clientAddress);
  const ua = request.headers.get('user-agent');
  const ident = deriveIdent(ip, ua);

  // ---- Gate (server-authoritative) --------------------------------------
  const decision = await guardPrompt(ident);
  if (!decision.allowed) {
    const messages: Record<string, string> = {
      AUTH_REQUIRED: 'Please sign in to continue chatting.',
      DAILY_LIMIT: `You've reached today's limit of ${DAILY_LIMIT} questions.`,
      RATE_LIMIT: "You're sending messages a little too fast — give me a few seconds.",
    };
    return json(
      {
        ok: false,
        code: decision.code,
        message: messages[decision.code] ?? 'Request blocked.',
        remaining: decision.remaining,
        authed: decision.authed,
      },
      decision.code === 'RATE_LIMIT' ? 429 : 200
    );
  }

  // ---- Offline engine first ---------------------------------------------
  const context = sanitizeContext(body?.context);
  const offline = runOfflineEngine(input, context);

  const useLlm = offline.confidence < HIGH_CONFIDENCE && groqConfigured();

  if (!useLlm) {
    const { osActions, media } = splitActions(offline.actions as OfflineAction[]);
    return json({
      ok: true,
      source: 'offline',
      reply: offline.reply,
      actions: osActions,
      media: media ?? offline.media,
      context,
      remaining: decision.remaining,
      authed: decision.authed,
    });
  }

  // ---- Defer to the LLM, gracefully falling back to the engine ----------
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const llmMessages: GroqMessage[] = rawMessages
    .filter(
      (m: any) =>
        m &&
        (m.role === 'system' || m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 6000) }))
    .slice(-20);

  try {
    const result = await callGroq(llmMessages);
    const { osActions, media } = splitActions(result.actions);
    return json({
      ok: true,
      source: 'llm',
      reply: result.message,
      actions: osActions,
      media,
      context,
      remaining: decision.remaining,
      authed: decision.authed,
    });
  } catch (e: any) {
    console.error('[copilot] LLM error, falling back to offline:', e?.message || e);
    const { osActions, media } = splitActions(offline.actions as OfflineAction[]);
    return json({
      ok: true,
      source: 'offline-fallback',
      reply: offline.reply,
      actions: osActions,
      media: media ?? offline.media,
      context,
      remaining: decision.remaining,
      authed: decision.authed,
    });
  }
};
