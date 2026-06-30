/**
 * Offline copilot — public API.
 *
 * Usage:
 *   const ctx = createContext();              // once per chat session
 *   const result = runOfflineEngine(text, ctx);
 *   if (result.confidence >= HIGH_CONFIDENCE) { ...answer locally... }
 *   else { ...try LLM, fall back to result on failure... }
 */

export { runOfflineEngine, HIGH_CONFIDENCE } from './engine';
export { createContext } from './types';
export type { OfflineResult, OfflineAction, ConvContext } from './types';
