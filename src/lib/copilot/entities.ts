/**
 * Entity extraction — pulls structured slots (project, app, facet) out of a
 * free-text message so intents can respond specifically.
 */

import { PROJECT_KB, findApp } from './knowledgeBase';
import { normalize } from './nlp';
import type { Entities, ProjectFacet } from './types';

const FACET_KEYWORDS: { facet: ProjectFacet; words: string[] }[] = [
  { facet: 'tech', words: ['tech', 'technology', 'technologies', 'stack', 'built with', 'tools', 'languages', 'framework', 'frameworks'] },
  { facet: 'features', words: ['feature', 'features', 'functionality', 'capabilities', 'capability'] },
  { facet: 'challenges', words: ['challenge', 'challenges', 'obstacle', 'tricky', 'hardest'] },
  { facet: 'architecture', words: ['architecture', 'how does it work', 'how it works', 'pipeline'] },
  { facet: 'outcome', words: ['outcome', 'impact', 'achieved'] },
  { facet: 'demo', words: ['demo', 'walkthrough'] },
];

export function extractProjectId(input: string): string | undefined {
  const q = input.toLowerCase();
  let best: { id: string; len: number } | undefined;
  for (const p of PROJECT_KB) {
    for (const alias of p.aliases) {
      if (q.includes(alias) && (!best || alias.length > best.len)) {
        best = { id: p.id, len: alias.length };
      }
    }
  }
  return best?.id;
}

export function extractFacet(input: string): ProjectFacet | undefined {
  // Plain normalized matching (no synonym expansion) so facet words don't
  // collide with unrelated synonyms (e.g. "built" → "project").
  const q = ` ${normalize(input)} `;
  for (const { facet, words } of FACET_KEYWORDS) {
    if (words.some((w) => q.includes(` ${normalize(w)} `) || q.includes(` ${normalize(w)}`))) {
      return facet;
    }
  }
  return undefined;
}

export function extractEntities(input: string): Entities {
  const projectId = extractProjectId(input);
  const app = findApp(input);
  const facet = extractFacet(input);
  return {
    projectId,
    appId: app?.appId,
    facet,
  };
}
