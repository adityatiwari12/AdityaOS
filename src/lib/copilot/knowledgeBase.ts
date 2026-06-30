/**
 * Structured knowledge base for the offline copilot.
 *
 * Everything is derived from the existing site config so there is a single
 * source of truth. Project facets (overview/tech/features/challenges/…) are
 * curated here per project. To add a project, extend `projects.ts` and add an
 * entry to PROJECT_KB below.
 */

import { userConfig } from '../../config/index';
import type { AppId } from '../../os/types';
import type { ProjectFacet } from './types';

const firstName = userConfig.name.split(' ')[0];
const age = new Date().getFullYear() - userConfig.yearOfBirth;

export const TOKENISTT_URL = 'https://www.tokenistt.com';
export const BLOG_URL =
  'https://medium.com/@tiwariaditya005/when-machines-learned-to-remember-5769d86c1b49';

export const identity = {
  firstName,
  name: userConfig.name,
  age,
  role: userConfig.role,
  location: userConfig.location,
  email: userConfig.contact.email,
  github: userConfig.social.github,
  linkedin: userConfig.social.linkedin,
  summary: userConfig.summary ?? userConfig.roleFocus,
  roleFocus: userConfig.roleFocus,
};

export const skillsByGroup: { group: string; items: string[] }[] = [
  { group: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'SQL'] },
  { group: 'AI / ML', items: ['LLMs', 'RAG', 'Prompt Engineering', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'OCR', 'NER'] },
  { group: 'Frameworks', items: ['React.js', 'React Native', 'Next.js', 'Node.js', 'Express.js', 'FastAPI'] },
  { group: 'Databases', items: ['PostgreSQL', 'MongoDB', 'Firebase'] },
  { group: 'DevOps', items: ['Docker', 'Git', 'Linux', 'CI/CD'] },
  { group: 'Product & Analytics', items: ['Figma', 'Notion', 'Linear', 'Jira', 'Tableau', 'Power BI'] },
];

export const experience = userConfig.experience.map((e) => ({
  title: e.title,
  company: e.company,
  location: e.location,
  period: e.period,
  description: e.description,
  technologies: e.technologies ?? [],
}));

export const education = userConfig.education.map((e) => ({
  degree: e.degree,
  major: e.major,
  institution: e.institution,
  location: e.location,
  year: e.year,
  description: e.description,
}));

export const publications = userConfig.publications.map((p) => ({
  title: p.title,
  venue: p.venue,
  year: p.year,
  awards: p.awards ?? [],
}));

export const competitions = userConfig.competitions.map((c) => ({
  title: c.title,
  year: c.year,
  achievement: c.achievement,
  description: c.description,
}));

/** Hackathon wins & podium finishes (Winner / Runner-Up). */
export const hackathonWins = competitions.filter((c) =>
  /winner|runner[- ]?up|1st|2nd|3rd|first place/i.test(c.achievement)
);

/** Finalist / top-N placements (incl. international). */
export const hackathonFinalists = competitions.filter((c) =>
  /finalist|top[- ]?\d+/i.test(c.achievement)
);

export const hackathonSummary =
  "I'm a serial hackathon competitor — a 6× national hackathon winner and 3× international finalist. " +
  'My first-ever win was AI Fusion 2026, and since then I\'ve won across healthcare, government, and ' +
  'innovation hackathons including MEDI<VERSE>, Kriyeta 5.0, and the Ministry of Tribal Affairs Hackathon 2.0.';

export const certifications = userConfig.certifications.map((c) => ({
  title: c.title,
  issuer: c.issuer,
}));

/** Curated per-project facets used to answer detailed project questions. */
interface ProjectKB {
  id: string;
  name: string;
  aliases: string[];
  tagline: string;
  overview: string;
  tech: string[];
  features: string[];
  challenges: string;
  architecture: string;
  outcome: string;
  repoUrl?: string;
}

export const PROJECT_KB: ProjectKB[] = [
  {
    id: 'talkwithdb',
    name: 'TalkWithDB',
    aliases: ['talkwithdb', 'talk with db', 'database assistant', 'nl to sql', 'sql assistant', 'db'],
    tagline: 'Enterprise desktop AI that turns plain English into safe, schema-grounded SQL.',
    overview:
      'TalkWithDB is a desktop-first AI database assistant. You connect a PostgreSQL database and ask questions in plain English; it returns validated, SQL-backed answers with explanations — built for analysts, managers, and engineering leads who need fast, traceable insights without writing SQL.',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'Ollama (Llama 3.2)', 'FAISS', 'RAG', 'SQLite', 'Docker'],
    features: [
      'Schema-aware hybrid RAG (BM25 + vector search) for accurate SQL generation',
      'Read-only guardrails that sanitize and validate every query before execution',
      'Multi-query reasoning (primary + count + diagnostic) for richer answers',
      'Conversation memory, local session persistence, and query caching',
      'Explainable, human-readable responses instead of raw rows',
    ],
    challenges:
      'trust and reliability — stopping the model from hallucinating SQL on large, relationally complex schemas. I solved it with a hybrid RAG retrieval layer to ground generation in the right schema context, plus a dedicated validation/guardrails layer enforcing read-only, sanitized execution.',
    architecture:
      'A modular FastAPI backend: a hybrid retriever (BM25 keyword + FAISS vector similarity) grounds an LLM (Llama 3.2 via Ollama) in relevant schema, generated SQL passes through a validation/guardrails layer, executes read-only against PostgreSQL, and results are transformed into explainable answers in a desktop chat UI.',
    outcome:
      'Evolved from prompt-based prototypes into a trustworthy, explainable system that closes the gap between business questions and data-backed decisions — with safety and reliability as first-class concerns.',
    repoUrl: 'https://github.com/adityatiwari12/TalkwithDB',
  },
  {
    id: 'sanjivani',
    name: 'Sanjivani',
    aliases: ['sanjivani', 'sanjeevni', 'healthcare', 'health', 'medical', 'medicine', 'medication', 'wearable', 'iot health'],
    tagline: 'AI-powered medication safety & health monitoring with an IoT wearable.',
    overview:
      'Sanjivani is an AI medication-safety and health-monitoring platform for patients — especially the elderly and those on multiple medications. Scan a medicine strip via on-device OCR to auto-extract dosage and expiry, check harmful drug interactions via RxNorm, and monitor vitals through an ESP32 wearable, with an always-on emergency Health Resume.',
    tech: ['React Native', 'Python', 'FastAPI', 'ESP32', 'OCR', 'RxNorm', 'Firebase'],
    features: [
      'On-device OCR medicine scanning (name, dosage, expiry extraction)',
      'RxNorm-based drug-interaction checks with real-time safety alerts',
      'ESP32 IoT wearable streaming heart rate, SpO2, and temperature',
      'Always-on emergency Health Resume accessible via QR code',
      'Guardian support and abnormal-pattern detection for adverse reactions',
    ],
    challenges:
      'Correlating physiological signals from the wearable with medication history in real time — so the system can flag potential adverse drug reactions early — while keeping OCR reliable on-device and the emergency profile instantly accessible.',
    architecture:
      'A React Native app paired with a Python/FastAPI backend and an ESP32 wearable. OCR + RxNorm standardize and check medicines; the wearable streams vitals that are correlated with medication data; Firebase powers sync, reminders, and guardian alerts; an always-on emergency screen exposes the Health Resume via QR.',
    outcome:
      'Won $1,000+ across multiple hackathons. Delivers a continuous healthcare companion that makes medication safer, improves adherence, and speeds up emergency response.',
    repoUrl: 'https://github.com/adityatiwari12',
  },
];

export function findProject(id: string): ProjectKB | undefined {
  return PROJECT_KB.find((p) => p.id === id);
}

/** Tiny rotating helper so repeated facet questions don't read identically. */
function rotate(seed: string, options: string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

export function projectFacetText(p: ProjectKB, facet: ProjectFacet): string {
  switch (facet) {
    case 'tech': {
      const lead = rotate(p.id + 'tech', [
        `On the tech side, I built **${p.name}** with`,
        `**${p.name}** runs on a stack I'm pretty happy with —`,
        `For **${p.name}**, I reached for`,
      ]);
      return `${lead} ${p.tech.join(', ')}. Happy to go deeper on any one of those — just ask how I used it.`;
    }
    case 'features': {
      const lead = rotate(p.id + 'feat', [
        `Here's what **${p.name}** can actually do:`,
        `The features I'm proudest of in **${p.name}**:`,
        `**${p.name}** packs a fair bit in —`,
      ]);
      return `${lead}\n\n${p.features.map((f) => `- ${f}`).join('\n')}\n\nWant me to walk through the architecture or open the project?`;
    }
    case 'challenges': {
      const lead = rotate(p.id + 'chal', [
        `Honestly, the trickiest part of **${p.name}** was this:`,
        `The hardest problem I hit building **${p.name}**:`,
        `Great question — the real challenge in **${p.name}** was`,
      ]);
      return `${lead} ${p.challenges}`;
    }
    case 'architecture': {
      const lead = rotate(p.id + 'arch', [
        `Here's how **${p.name}** fits together under the hood:`,
        `Architecturally, **${p.name}** looks like this:`,
        `Let me walk you through how **${p.name}** is wired:`,
      ]);
      return `${lead}\n\n${p.architecture}\n\nWant the deeper dive? Say "open ${p.name}".`;
    }
    case 'outcome': {
      const lead = rotate(p.id + 'out', [
        `Where **${p.name}** landed:`,
        `The payoff with **${p.name}**:`,
        `As for results —`,
      ]);
      return `${lead} ${p.outcome}`;
    }
    case 'demo':
      return `I'd love to show you **${p.name}** in action — pulling up the demo video now.`;
    case 'overview':
    default:
      return `**${p.name}** — ${p.tagline}\n\n${p.overview}\n\nAsk me about the tech, the architecture, or the hardest part of building it — or say "open ${p.name}" to explore it.`;
  }
}

/** Apps the copilot can launch, with natural-language aliases. */
export const APP_ALIASES: { appId: AppId; title: string; aliases: string[] }[] = [
  { appId: 'terminal', title: 'AI Copilot', aliases: ['terminal', 'copilot', 'ai copilot', 'assistant', 'chat', 'console'] },
  { appId: 'finder', title: 'Finder', aliases: ['finder', 'files', 'file browser', 'explorer', 'folders'] },
  { appId: 'photos', title: 'Photos', aliases: ['photos', 'gallery', 'pictures', 'images', 'memories'] },
  { appId: 'notes', title: 'Notes', aliases: ['notes', 'note', 'certifications', 'competitions', 'activities'] },
  { appId: 'resume', title: 'Resume', aliases: ['resume', 'cv', 'curriculum vitae'] },
  { appId: 'github', title: 'Projects', aliases: ['projects', 'repos', 'repositories', 'my work', 'my projects', 'codebase'] },
  { appId: 'founder-hq', title: 'Founder HQ', aliases: ['founder hq', 'startup hq', 'tokenistt', 'startup', 'founder', 'company'] },
  { appId: 'research-center', title: 'Research Center', aliases: ['research', 'research center', 'papers', 'publications'] },
  { appId: 'videos', title: 'Project Videos', aliases: ['videos', 'demos', 'project videos', 'demo videos', 'walkthrough'] },
  { appId: 'collaboration', title: 'Book Meeting', aliases: ['calendar', 'meeting', 'book meeting', 'schedule', 'call', 'collaboration', 'book a meeting'] },
  { appId: 'contributions', title: 'GitHub Activity', aliases: ['github activity', 'contributions', 'activity', 'commits', 'streak'] },
  { appId: 'spotify', title: 'Spotify', aliases: ['spotify', 'music', 'playlist', 'songs'] },
  { appId: 'hackathon-rush', title: 'Jumping Game', aliases: ['hackathon rush', 'jumping game', 'runner', 'endless runner', 'game', 'play', 'mini game'] },
];

export function findApp(text: string): { appId: AppId; title: string } | undefined {
  const q = text.toLowerCase();
  // Prefer the longest alias match so "founder hq" beats "founder".
  let best: { appId: AppId; title: string; len: number } | undefined;
  for (const app of APP_ALIASES) {
    for (const alias of app.aliases) {
      if (q.includes(alias) && (!best || alias.length > best.len)) {
        best = { appId: app.appId, title: app.title, len: alias.length };
      }
    }
  }
  return best ? { appId: best.appId, title: best.title } : undefined;
}
