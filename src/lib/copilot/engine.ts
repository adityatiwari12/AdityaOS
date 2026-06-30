/**
 * Offline copilot engine — orchestration layer.
 *
 * Pipeline: normalize → extract entities → resolve follow-ups from context →
 * score every intent (semantic + keyword, respecting gates) → build the best
 * response with rotating variants → update conversational context.
 *
 * Returns a confidence the caller uses to decide whether to answer locally or
 * defer to the LLM. The engine ALWAYS returns a usable reply so the caller can
 * fall back to it if the LLM is unavailable.
 */

import { intents } from './intents';
import { extractEntities } from './entities';
import { findProject, projectFacetText, identity } from './knowledgeBase';
import { tokenize, phraseSimilarity, containsKeyword } from './nlp';
import {
  type ConvContext, type Entities, type OfflineResult, type RespondCtx,
} from './types';

/** Above this, answer locally without touching the LLM (saves all tokens). */
export const HIGH_CONFIDENCE = 0.5;
/** Below this, the engine had essentially no idea (pure fallback). */
const FLOOR = 0.26;

const FOLLOWUP_MORE = /\b(more|elaborate|continue|go on|tell me more|further|expand|details?)\b/i;
const FOLLOWUP_OPENIT = /\b(open|show|launch|see|view)\s+(it|this|that|them|one)\b/i;
const NAV_VERBS = /\b(open|launch|show|go to|goto|take me to|navigate|view|display|visit|start)\b/i;

function makePick(context: ConvContext) {
  return (intentId: string, variants: string[]): string => {
    if (variants.length === 1) return variants[0];
    const used = context.usedVariants[intentId] ?? [];
    const fresh = variants.map((_, i) => i).filter((i) => !used.includes(i));
    const pool = fresh.length ? fresh : variants.map((_, i) => i);
    const choice = pool[Math.floor(Math.random() * pool.length)];
    context.usedVariants[intentId] = [...used, choice].slice(-(variants.length - 1));
    return variants[choice];
  };
}

function scoreIntent(input: string, inputTokens: string[], intent: typeof intents[number]): number {
  let semantic = 0;
  for (const u of intent.utterances) {
    const s = phraseSimilarity(input, inputTokens, u);
    if (s > semantic) semantic = s;
    if (semantic > 0.95) break;
  }
  let keyword = 0;
  if (intent.keywords?.length) {
    const hits = intent.keywords.filter((k) => containsKeyword(inputTokens, k)).length;
    if (hits > 0) keyword = Math.min(1, 0.55 + 0.22 * hits);
  }
  let score = Math.max(semantic, keyword * 0.96);
  return score * (intent.weight ?? 1);
}

function buildResult(
  intent: typeof intents[number],
  rctx: RespondCtx,
  score: number,
): { result: OfflineResult; topic?: string } {
  const res = intent.respond(rctx);
  // A hardcoded response confidence (e.g. action intents → 0.9) is only trusted
  // when the intent actually matched reasonably; a barely-winning intent keeps
  // its low raw score so the caller defers to the LLM.
  const confidence = res.confidence !== undefined && score >= 0.5 ? res.confidence : score;
  return {
    result: {
      reply: res.text,
      actions: res.actions ?? [],
      media: res.media,
      confidence: Math.min(0.98, confidence),
      intentId: intent.id,
    },
    topic: res.topic,
  };
}

function updateContext(context: ConvContext, result: OfflineResult, entities: Entities, topic?: string) {
  context.turns += 1;
  context.lastIntentId = result.intentId;
  if (entities.projectId) context.lastProjectId = entities.projectId;
  if (topic) context.lastProjectId = topic;
  if (entities.appId) context.lastAppId = entities.appId;
  if (entities.facet) context.lastFacet = entities.facet;
}

export function runOfflineEngine(rawInput: string, context: ConvContext): OfflineResult {
  const input = rawInput.trim();
  const inputTokens = tokenize(input);
  const entities = extractEntities(input);
  const pick = makePick(context);

  // Track which entities were explicit in THIS message vs. inherited from
  // context — only explicit entities should boost gated intents.
  const explicitProjectId = entities.projectId;
  const explicitAppId = entities.appId;

  // ---- Follow-up resolution from conversational context ------------------
  // "open it / show this" → act on the last referenced project or app.
  if (FOLLOWUP_OPENIT.test(input) && !entities.projectId && !entities.appId) {
    if (context.lastProjectId) {
      const p = findProject(context.lastProjectId);
      if (p) {
        const result: OfflineResult = {
          reply: `Opening **${p.name}** for you.`,
          actions: [{ type: 'openWindow', appId: 'github', payload: { projectId: p.id } }],
          confidence: 0.9,
          intentId: 'followup_open',
        };
        updateContext(context, result, entities, p.id);
        return result;
      }
    }
    if (context.lastAppId) {
      const result: OfflineResult = {
        reply: `Opening it for you.`,
        actions: [{ type: 'openWindow', appId: context.lastAppId }],
        confidence: 0.88,
        intentId: 'followup_open',
      };
      updateContext(context, result, entities);
      return result;
    }
  }

  // "tell me more / elaborate" → deepen the last project topic.
  if (FOLLOWUP_MORE.test(input) && !entities.projectId && context.lastProjectId) {
    const p = findProject(context.lastProjectId);
    if (p) {
      const text = `${projectFacetText(p, 'architecture')}\n\n${projectFacetText(p, 'outcome')}`;
      const result: OfflineResult = { reply: text, actions: [], confidence: 0.82, intentId: 'followup_more' };
      updateContext(context, result, entities, p.id);
      return result;
    }
  }

  // Backfill a project entity for facet questions like "what tech did you use?".
  if (!entities.projectId && entities.facet && context.lastProjectId) {
    entities.projectId = context.lastProjectId;
  }

  // ---- Score every (gated) intent ---------------------------------------
  const rctx: RespondCtx = { input, entities, context, pick };
  let best: { intent: typeof intents[number]; score: number } | undefined;
  for (const intent of intents) {
    if (intent.gate && !intent.gate(entities)) continue;
    let score = scoreIntent(input, inputTokens, intent);
    // Boost only entity-presence intents, and only when the entity was explicit
    // in this message — a context-inherited project shouldn't hijack an
    // unrelated question, and "absence" gates (e.g. projects_overview) get none.
    const boost =
      (intent.id === 'project_detail' && !!explicitProjectId) ||
      (intent.id === 'open_app' && !!explicitAppId);
    if (boost) score = Math.min(1, score + 0.22);
    if (!best || score > best.score) best = { intent, score };
  }

  // ---- High/low confidence answer ---------------------------------------
  if (best && best.score >= FLOOR) {
    const { result, topic } = buildResult(best.intent, rctx, best.score);
    updateContext(context, result, entities, topic ?? entities.projectId);
    return result;
  }

  // ---- Pure fallback: closest helpful answer, low confidence -------------
  const fallback: OfflineResult = {
    reply: pick('fallback', [
      `I want to make sure I answer the right thing — I didn't quite catch that one. I'm best at talking about my background, skills, experience, research, projects, and my startup Tokenistt. Try something like "What's your tech stack?", "Explain TalkWithDB", or "Open Founder HQ".`,
      `Hmm, let me make sure I get you the right answer. You can ask me about my projects, my startup, my research, or my skills — or I can open things for you. For example: "Show my hackathon wins" or "Open my resume".`,
      `I might've missed the mark there — mind rephrasing? In the meantime, I can tell you about my work, experience, or education, or jump to something like "Open Projects" or "Show healthcare projects".`,
    ]),
    actions: [],
    confidence: 0.2,
    intentId: 'fallback',
  };
  context.turns += 1;
  context.lastIntentId = 'fallback';
  return fallback;
}
