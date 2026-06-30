import type { AppId, MediaKind, WindowPayload } from '../../os/types';

/**
 * Offline copilot — shared types.
 *
 * The offline intelligence layer is split into independent concerns:
 *   nlp.ts            → text normalization, synonyms, fuzzy similarity
 *   knowledgeBase.ts  → structured facts (about, skills, projects, faqs…)
 *   intents.ts        → intent registry (detection examples + response builders)
 *   engine.ts         → orchestration: scoring, entities, context, degradation
 *
 * Adding new knowledge/intents/actions should only require editing the data
 * files (knowledgeBase.ts / intents.ts), never the engine.
 */

/** Actions the engine can ask the UI to perform. */
export type OfflineAction =
  | { type: 'openWindow'; appId: AppId; payload?: WindowPayload }
  | { type: 'openLink'; url: string }
  | { type: 'showMedia'; media: MediaKind };

/** A single resolved answer from the offline engine. */
export interface OfflineResult {
  /** Markdown reply text shown to the user. */
  reply: string;
  /** Frontend actions to dispatch (open apps, links, media). */
  actions: OfflineAction[];
  /** Inline media to render in the chat bubble. */
  media?: MediaKind;
  /** 0–1 confidence that this answer is correct. */
  confidence: number;
  /** The intent id that produced the answer (for context / debugging). */
  intentId: string;
}

/** Entities extracted from the user's message. */
export interface Entities {
  projectId?: string;
  appId?: AppId;
  /** A facet of a project, e.g. "tech", "features", "challenges". */
  facet?: ProjectFacet;
  topic?: string;
}

export type ProjectFacet =
  | 'overview'
  | 'tech'
  | 'features'
  | 'challenges'
  | 'architecture'
  | 'outcome'
  | 'demo';

/** Per-session conversational memory enabling follow-ups. */
export interface ConvContext {
  lastIntentId?: string;
  lastProjectId?: string;
  lastAppId?: AppId;
  lastTopic?: string;
  lastFacet?: ProjectFacet;
  /** Recently used response variants, to avoid repetition (per intent). */
  usedVariants: Record<string, number[]>;
  /** Number of turns handled so far. */
  turns: number;
}

export function createContext(): ConvContext {
  return { usedVariants: {}, turns: 0 };
}

/** Context passed to an intent's response builder. */
export interface RespondCtx {
  input: string;
  entities: Entities;
  context: ConvContext;
  /** Pick a non-repeating variant for the given intent. */
  pick: (intentId: string, variants: string[]) => string;
}

export interface IntentResponse {
  text: string;
  actions?: OfflineAction[];
  media?: MediaKind;
  topic?: string;
  /** Override the computed confidence (e.g. exact action commands → 0.95). */
  confidence?: number;
}

export interface Intent {
  id: string;
  /** Example phrasings used for semantic matching. */
  utterances: string[];
  /** Strong signal words (matched with synonyms + fuzzy). */
  keywords?: string[];
  /** Build the response. */
  respond: (ctx: RespondCtx) => IntentResponse;
  /** Optional base weight to bias important intents (default 1). */
  weight?: number;
  /** Only consider this intent when the gate passes (e.g. an entity exists). */
  gate?: (entities: Entities) => boolean;
}
