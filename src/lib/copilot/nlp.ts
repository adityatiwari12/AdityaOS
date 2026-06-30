/**
 * Lightweight NLP utilities for the offline copilot.
 *
 * No external deps — just normalization, synonym expansion, fuzzy token
 * matching (Levenshtein) and phrase similarity (Dice bigrams + token Jaccard).
 * This is what lets the engine handle synonyms, paraphrases and typos without
 * an LLM.
 */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'but',
  'with', 'about', 'as', 'by', 'i', 'you', 'your', 'yours', 'me', 'my', 'mine',
  'we', 'us', 'it', 'its', 'this', 'that', 'these', 'those', 'please', 'can',
  'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'have', 'has',
  'had', 'just', 'so', 'then', 'there', 'here', 'now', 'some', 'any',
]);

/**
 * Synonym groups — every term in a group is treated as interchangeable when
 * scoring. Add new groups freely; the engine picks them up automatically.
 */
const SYNONYM_GROUPS: string[][] = [
  ['open', 'launch', 'start', 'run', 'go', 'goto', 'navigate', 'take', 'show', 'display', 'view', 'pull', 'bring', 'see', 'visit', 'access'],
  ['project', 'projects', 'work', 'works', 'build', 'built', 'building', 'app', 'application', 'apps', 'product', 'products', 'portfolio'],
  ['about', 'who', 'yourself', 'intro', 'introduce', 'bio', 'background', 'story'],
  ['skill', 'skills', 'tech', 'technology', 'technologies', 'stack', 'expertise', 'know', 'knowledge', 'proficient', 'languages', 'tools'],
  ['experience', 'job', 'jobs', 'role', 'roles', 'career', 'employment', 'worked', 'internship', 'intern', 'position'],
  ['education', 'study', 'studied', 'college', 'university', 'degree', 'school', 'academics', 'cgpa', 'gpa'],
  ['contact', 'email', 'mail', 'reach', 'connect', 'hire', 'message', 'touch', 'collaborate'],
  ['resume', 'cv', 'curriculum'],
  ['research', 'paper', 'papers', 'publication', 'publications', 'journal', 'published'],
  ['startup', 'founder', 'company', 'venture', 'tokenistt', 'cofounder'],
  ['achievement', 'achievements', 'award', 'awards', 'win', 'wins', 'won', 'hackathon', 'hackathons', 'accomplishment', 'trophy', 'trophies'],
  ['photo', 'photos', 'picture', 'pictures', 'gallery', 'image', 'images', 'memories'],
  ['healthcare', 'health', 'medical', 'medicine', 'medication', 'sanjivani', 'sanjeevni', 'wearable'],
  ['database', 'db', 'sql', 'postgres', 'talkwithdb', 'data'],
  ['video', 'videos', 'demo', 'demos', 'walkthrough', 'recording'],
  ['hello', 'hi', 'hey', 'yo', 'hii', 'heya', 'greetings', 'sup', 'howdy'],
  ['thanks', 'thank', 'thankyou', 'thx', 'appreciate', 'cheers'],
  ['more', 'elaborate', 'continue', 'detail', 'details', 'further', 'explain', 'tell'],
  ['feature', 'features', 'functionality', 'capabilities', 'does', 'do'],
  ['challenge', 'challenges', 'problem', 'problems', 'hard', 'difficult', 'obstacle'],
  ['architecture', 'design', 'structure', 'system', 'pipeline', 'how'],
  ['outcome', 'result', 'results', 'impact', 'outcomes', 'achieved'],
];

const SYNONYM_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  SYNONYM_GROUPS.forEach((group) => {
    const canonical = group[0];
    group.forEach((w) => { map[w] = canonical; });
  });
  return map;
})();

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Map a token to its canonical synonym (if any). */
function canonical(token: string): string {
  return SYNONYM_MAP[token] ?? token;
}

/** Tokenize → drop stopwords → map to canonical synonyms. */
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    .map(canonical);
}

/** Classic Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        prevDiag + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prevDiag = tmp;
    }
  }
  return prev[b.length];
}

/** Typo-tolerant token equality (edit distance scaled to word length). */
export function fuzzyTokenEqual(a: string, b: string): boolean {
  if (a === b) return true;
  const max = Math.max(a.length, b.length);
  if (max <= 3) return a === b;
  const tolerance = max <= 5 ? 1 : 2;
  return levenshtein(a, b) <= tolerance;
}

/** Dice coefficient over character bigrams — robust phrase similarity. */
export function diceCoefficient(a: string, b: string): number {
  const bigrams = (s: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      out.set(bg, (out.get(bg) ?? 0) + 1);
    }
    return out;
  };
  const na = normalize(a).replace(/\s/g, '');
  const nb = normalize(b).replace(/\s/g, '');
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;
  const A = bigrams(na);
  const B = bigrams(nb);
  let overlap = 0;
  let total = 0;
  A.forEach((count) => { total += count; });
  B.forEach((count, bg) => {
    total += count;
    const inA = A.get(bg) ?? 0;
    overlap += Math.min(inA, count);
  });
  return (2 * overlap) / total;
}

/** Token-set similarity with synonym + fuzzy matching (0–1). */
export function tokenSimilarity(aTokens: string[], bTokens: string[]): number {
  if (!aTokens.length || !bTokens.length) return 0;
  let matched = 0;
  const usedB = new Set<number>();
  for (const at of aTokens) {
    for (let j = 0; j < bTokens.length; j++) {
      if (usedB.has(j)) continue;
      if (fuzzyTokenEqual(at, bTokens[j])) {
        matched += 1;
        usedB.add(j);
        break;
      }
    }
  }
  // Recall over the shorter set rewards short example utterances.
  return matched / Math.min(aTokens.length, bTokens.length);
}

/** Whether the (tokenized) input contains a keyword/phrase, fuzzily. */
export function containsKeyword(inputTokens: string[], keyword: string): boolean {
  const kwTokens = tokenize(keyword);
  if (!kwTokens.length) return false;
  return kwTokens.every((kt) => inputTokens.some((it) => fuzzyTokenEqual(it, kt)));
}

/** Combined phrase similarity between an input and an example utterance. */
export function phraseSimilarity(input: string, inputTokens: string[], utterance: string): number {
  const uTokens = tokenize(utterance);
  const tokenSim = tokenSimilarity(inputTokens, uTokens);
  const diceSim = diceCoefficient(input, utterance);
  return Math.max(tokenSim * 0.85, tokenSim * 0.6 + diceSim * 0.4);
}
