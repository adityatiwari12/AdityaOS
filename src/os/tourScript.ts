import type { RefObject } from 'react';
import type { CursorHandle } from '../components/os/VirtualCursor';
import { useOSStore } from '../stores/osStore';
import { useTourStore } from '../stores/tourStore';
import type { AppId, WindowPayload } from './types';

export interface TourContext {
  cursor: RefObject<CursorHandle | null>;
  cancel: { cancelled: boolean };
}

// ── Utilities ────────────────────────────────────────────────────────────────

function delay(ms: number, cancel: { cancelled: boolean }): Promise<void> {
  return new Promise((res, rej) => {
    if (cancel.cancelled) { rej(new Error('tour-cancelled')); return; }
    const t = setTimeout(() => {
      if (cancel.cancelled) { rej(new Error('tour-cancelled')); } else { res(); }
    }, ms);
    const poll = setInterval(() => {
      if (cancel.cancelled) { clearInterval(poll); clearTimeout(t); rej(new Error('tour-cancelled')); }
    }, 50);
    setTimeout(() => clearInterval(poll), ms + 100);
  });
}

function advance(step: number, title: string, body: string) {
  useTourStore.getState()._advance(step, title, body);
}

async function openApp(appId: AppId, title: string, ctx: TourContext, payload?: WindowPayload) {
  useOSStore.getState().openWindow(appId, title, payload);
  await delay(900, ctx.cancel);
}

async function clickDockIcon(appId: AppId, ctx: TourContext) {
  const el = document.querySelector(`[data-tour-id="dock-${appId}"]`) as HTMLElement | null;
  if (el) {
    const r = el.getBoundingClientRect();
    await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
    await delay(900, ctx.cancel);
  } else {
    const reg = (await import('./appRegistry')).appRegistry.find((a) => a.id === appId);
    await openApp(appId, reg?.title ?? appId, ctx);
  }
}

/** Scroll element into view, then ease cursor to its center and hold. */
async function hoverTourTarget(id: string, ctx: TourContext, holdMs = 3000) {
  const el = document.querySelector(`[data-tour-id="${id}"]`) as HTMLElement | null;
  if (!el) { await delay(holdMs, ctx.cancel); return; }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(400, ctx.cancel);
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + Math.min(70, r.height / 2);
  await ctx.cursor.current?.moveTo(x, y, 800);
  await delay(holdMs, ctx.cancel);
}

async function scrollToTarget(selector: string, ctx: TourContext) {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(400, ctx.cancel);
}

/** Click the traffic-light Close on the topmost dialog window (not lightbox). */
async function closeTopWindow(ctx: TourContext) {
  const all = [...document.querySelectorAll('button[aria-label="Close"]')] as HTMLElement[];
  // Traffic-light Close lives inside [role="dialog"]; lightbox Close does not
  const windowClose = all.filter((b) => {
    let el: HTMLElement | null = b;
    while (el) { if (el.getAttribute('role') === 'dialog') return true; el = el.parentElement; }
    return false;
  }).at(-1) ?? all.at(-1);
  if (!windowClose) return;
  const r = windowClose.getBoundingClientRect();
  await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
  await delay(500, ctx.cancel);
}

async function idleDrift(ctx: TourContext, durationMs = 2000) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2 - 60;
  await ctx.cursor.current?.moveTo(cx, cy, 1000);
  await delay(durationMs, ctx.cancel);
}

/** Open a photo in the gallery lightbox and narrate it. */
async function showPhoto(
  photoIndex: number,
  step: number,
  title: string,
  body: string,
  ctx: TourContext,
  holdMs = 4500,
) {
  advance(step, title, body);
  // Click Next arrow to advance if lightbox already open, else click the thumbnail
  const nextBtn = document.querySelector('button[aria-label="Next"]') as HTMLElement | null;
  if (nextBtn) {
    const nr = nextBtn.getBoundingClientRect();
    await ctx.cursor.current?.click(nr.left + nr.width / 2, nr.top + nr.height / 2);
  } else {
    // Lightbox not open yet — click the thumbnail
    const thumb = document.querySelector(`[data-tour-gallery-thumb="${photoIndex}"]`) as HTMLElement | null;
    if (thumb) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await delay(350, ctx.cancel);
      const r = thumb.getBoundingClientRect();
      await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
    }
  }
  await delay(holdMs, ctx.cancel);
}

// ── Tour Steps ────────────────────────────────────────────────────────────────

export async function runTourScript(ctx: TourContext) {
  try {
    // ── Step 0: Welcome ──────────────────────────────────────────────────────
    advance(0,
      "Hey — welcome to AdityaOS.",
      "I'm Aditya's AI assistant. I'll walk you through his work, projects, research, and wins in about two minutes. No clicking needed — just watch."
    );
    await idleDrift(ctx, 6000);

    // ── Step 1: Founder HQ ───────────────────────────────────────────────────
    advance(1,
      "Let's start with the startup.",
      "Aditya is Co-Founder and CPO of Tokenistt — an AI operating system for enterprises."
    );
    await clickDockIcon('founder-hq', ctx);

    await hoverTourTarget('fhq-tokenistt', ctx, 4000);
    advance(1,
      "Tokenistt in plain English.",
      "Companies are deploying AI at scale, but have no control layer. Tokenistt monitors, governs, and makes production AI reliable. Think of it as the control room enterprises never had."
    );
    await delay(4500, ctx.cancel);

    await hoverTourTarget('fhq-roadmap', ctx, 3500);
    advance(1,
      "The roadmap.",
      "From prototype to enterprise pilot to global scale. They're currently in active development and applied to Y Combinator Summer 2026."
    );
    await delay(4000, ctx.cancel);

    await hoverTourTarget('fhq-metrics', ctx, 3000);
    advance(1,
      "Traction and metrics.",
      "Early users, early signals. The numbers are small but they're real — built with real customers, not imaginary ones."
    );
    await delay(3500, ctx.cancel);

    await hoverTourTarget('fhq-traction', ctx, 3000);
    await closeTopWindow(ctx);

    // ── Step 2: Projects ─────────────────────────────────────────────────────
    advance(2,
      "Now let's look at what Aditya actually ships.",
      "These aren't tutorial clones. Every project solves a real problem with real technology."
    );
    await openApp('github', 'Projects', ctx);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    await delay(500, ctx.cancel);

    await ctx.cursor.current?.moveTo(cx - 250, cy - 120, 1000);
    advance(2,
      "TalkWithDB.",
      "Type a question in plain English, get a SQL query and live results back. Built with RAG, LLMs, and a FastAPI backend. Used by real users querying real databases."
    );
    await delay(4500, ctx.cancel);

    await ctx.cursor.current?.moveTo(cx + 250, cy + 80, 1000);
    advance(2,
      "Sanjivani — healthcare AI.",
      "An AI-powered diagnostic assistant using OCR, Named Entity Recognition, and deep learning to analyze medical records. Built for a national hackathon, pitched to actual hospitals."
    );
    await delay(4500, ctx.cancel);

    await ctx.cursor.current?.moveTo(cx - 80, cy + 200, 800);
    advance(2,
      "And there's more.",
      "Computer vision systems, NLP pipelines, full-stack platforms — each one production-grade, documented, and deployed. Not just GitHub repos that compile once."
    );
    await delay(3500, ctx.cancel);
    await closeTopWindow(ctx);

    // ── Step 3: Research ─────────────────────────────────────────────────────
    advance(3,
      "Research — because shipping isn't enough.",
      "Aditya has published peer-reviewed research in AI and machine learning."
    );
    await openApp('research-center', 'Research Center', ctx);

    await hoverTourTarget('rc-publications', ctx, 4000);
    advance(3,
      "Published. Peer-reviewed. Awarded.",
      "His research paper earned a Best Poster Award at a national conference. The work covers applied machine learning and was recognized by academics, not just engineers."
    );
    await delay(4500, ctx.cancel);

    await scrollToTarget('[data-tour-id="rc-certifications"]', ctx);
    await hoverTourTarget('rc-certifications', ctx, 3500);
    advance(3,
      "Certifications across the stack.",
      "AWS, Google Cloud, machine learning, deep learning, cybersecurity. The kind of breadth that means he can pick up any stack and ship without ramp-up time."
    );
    await delay(4000, ctx.cancel);
    await closeTopWindow(ctx);

    // ── Step 4: Gallery ──────────────────────────────────────────────────────
    advance(4,
      "Now — the gallery.",
      "These aren't stock photos. This is what six years of building actually looks like."
    );
    await openApp('photos', 'Photos', ctx, { photoIndex: 1 });
    await delay(800, ctx.cancel);

    // Photo 1: index 1 — thinktank-win (lightbox already open from photoIndex:1)
    advance(4,
      "IEEE Think Tank 2026 — Winner.",
      "This was a national-level competition organized by IEEE. Aditya's team beat hundreds of entries. That trophy is real, and that smile is genuine."
    );
    await delay(5000, ctx.cancel);

    // Photo 2: index 4 — ministry-hackathon-win
    await showPhoto(4, 4,
      "Ministry of Tribal Affairs — First Place.",
      "A government-organized hackathon where Aditya's team won first place and received an official grant from the Government of India. Not a university competition — actual government recognition.",
      ctx, 5000
    );

    // Photo 3: index 6 — ministry-cheque
    await showPhoto(6, 4,
      "The actual cheque.",
      "This is what winning a government grant looks like. Real money, from the Ministry. Handed over in a ceremony. Aditya was 20 years old.",
      ctx, 4500
    );

    // Photo 4: index 10 — ai-fusion-win
    await showPhoto(10, 4,
      "AI Fusion 2026 — First Place.",
      "One of the most competitive AI-focused hackathons in the country. Aditya's team went up against teams from IITs and NITs, and they came first.",
      ctx, 5000
    );

    // Photo 5: index 15 — best-research-paper-award
    await showPhoto(15, 4,
      "Best Research Paper Award.",
      "This one's different. Academic recognition, not a hackathon podium. His paper was selected as the best presented at a national research conference.",
      ctx, 5000
    );

    // Photo 6: index 18 — pitching-education-minister
    await showPhoto(18, 4,
      "Pitching to India's Education Minister.",
      "In the room with the Minister of Education, live demo, no net. This is the kind of room most developers never get to be in at any age — let alone at twenty.",
      ctx, 5500
    );

    // Close lightbox, then window
    const closeLight = [...document.querySelectorAll('button[aria-label="Close"]')]
      .find((b) => {
        let el: HTMLElement | null = b as HTMLElement;
        while (el) { if (el.getAttribute('role') === 'dialog') return false; el = el.parentElement; }
        return true;
      }) as HTMLElement | undefined;
    if (closeLight) {
      const lr = closeLight.getBoundingClientRect();
      await ctx.cursor.current?.click(lr.left + lr.width / 2, lr.top + lr.height / 2);
      await delay(500, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 5: Achievements ─────────────────────────────────────────────────
    advance(5,
      "Six-time National Hackathon Winner.",
      "This isn't a list of participation certificates."
    );
    await openApp('notes', 'Notes', ctx, { section: 'competitions' });
    await delay(600, ctx.cancel);

    await hoverTourTarget('notes-competitions-card', ctx, 4000);
    advance(5,
      "Real wins. Real stakes.",
      "IEEE Think Tank. Ministry of Tribal Affairs. Smart India Hackathon Finalist. AWS AI for Bharat International Top-5. CanHacks International. These competitions had real judges, real audiences, and real consequences."
    );
    await delay(5000, ctx.cancel);

    const notesEl = document.querySelector('[data-tour-id="notes-competitions-card"]');
    if (notesEl) {
      const r = notesEl.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(r.left + r.width / 2, r.bottom + 120, 900);
      advance(5,
        "And it's still growing.",
        "Every few months there's a new one. It's not luck — it's a pattern. Aditya finds the hardest problems in a room and figures out a way to solve them faster than everyone else."
      );
      await delay(4500, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 6: Game ─────────────────────────────────────────────────────────
    advance(6,
      "One more thing.",
      "He also built a game."
    );
    await openApp('hackathon-rush', 'Jumping Game', ctx);
    await delay(1000, ctx.cancel);

    const canvas = document.querySelector('[data-tour-id="hackathon-canvas"]') as HTMLElement | null;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(cr.left + cr.width / 2, cr.top + cr.height / 2, 800);
    }
    advance(6,
      "Hackathon Rush.",
      "A pixel-art endless runner built from scratch. Canvas rendering, custom physics engine, sprite animation — all in TypeScript. He built this between competitions, for fun."
    );
    for (let i = 0; i < 8; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      await delay(80, ctx.cancel);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      await delay(1300, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 7: Resume ───────────────────────────────────────────────────────
    advance(7,
      "And here's the full resume.",
      "Everything distilled to one page. Every role, every project, every publication — if you want to download it, there's a button on the next screen."
    );
    await openApp('resume', 'Resume', ctx);
    await delay(6000, ctx.cancel);
    await closeTopWindow(ctx);

    // ── Step 8: Final ────────────────────────────────────────────────────────
    advance(8,
      "That's the two-minute tour.",
      "Startup, projects, research, government wins, international competitions, and a game. Aditya is looking for the next big challenge. If that's something you're building — reach out."
    );
    const store = useOSStore.getState();
    store.windows.forEach((w) => store.closeWindow(w.id));
    await delay(800, ctx.cancel);
    useTourStore.getState()._finish();

  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'tour-cancelled') return;
    throw e;
  }
}
