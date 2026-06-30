import type { APIRoute } from 'astro';
import { callGroq, groqConfigured, type GroqMessage } from '../../lib/groqClient';
import { clientIp, deriveIdent, guardPrompt, DAILY_LIMIT } from '../../lib/copilotGuard';

const ts = () => new Date().toISOString();
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const err = (code: string, message: string, status: number) =>
  json({ code, message, timestamp: ts() }, status);

/**
 * Raw LLM endpoint. Primary copilot traffic goes through /api/copilot; this
 * route is kept for compatibility but is gated by the same server-side guard
 * so it can't be used to bypass the auth gate or daily/burst limits.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!groqConfigured()) {
    return err('CONFIG_ERROR', 'Chat service is not configured. Please contact the site administrator.', 503);
  }

  // Server-side gate (IP + UA based; not bypassable by clearing client state).
  const ident = deriveIdent(clientIp(request, clientAddress), request.headers.get('user-agent'));
  const decision = await guardPrompt(ident);
  if (!decision.allowed) {
    const map: Record<string, [string, number]> = {
      AUTH_REQUIRED: ['Please sign in to continue chatting.', 401],
      DAILY_LIMIT: [`You've reached today's limit of ${DAILY_LIMIT} questions.`, 429],
      RATE_LIMIT: ["You're sending messages a little too fast — give me a few seconds.", 429],
    };
    const [message, status] = map[decision.code] ?? ['Request blocked.', 429];
    return json({ code: decision.code, message, remaining: decision.remaining }, status);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return err('INVALID_JSON', 'Invalid request format', 400);
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return err('INVALID_MESSAGES', 'Messages array is required and must not be empty', 400);
  }

  const clean: GroqMessage[] = messages
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
    const result = await callGroq(clean);
    return json({ message: result.message, actions: result.actions, mode: result.mode }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'GROQ_NOT_CONFIGURED') {
      return err('CONFIG_ERROR', 'Chat service is not configured.', 503);
    }
    console.error('[Chat API] Error:', message);
    return err('AI_SERVICE_ERROR', 'The AI service is temporarily unavailable. Please try again.', 502);
  }
};
