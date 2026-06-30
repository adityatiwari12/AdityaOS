import type { RefObject } from 'react';
import type { CursorHandle } from '../components/os/VirtualCursor';
import { useOSStore } from '../stores/osStore';
import { useTourStore } from '../stores/tourStore';
import type { AppId, WindowPayload } from './types';
import { speakAndWait, stopAudio } from '../lib/tts';

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

/** Show caption and wait for TTS to finish before resolving.
 *  Falls back to a timed hold when muted. */
async function narrate(step: number, title: string, body: string, ctx: TourContext, mutedHoldMs = 2700) {
  advance(step, title, body);
  if (useTourStore.getState().muted) {
    await delay(mutedHoldMs, ctx.cancel);
  } else {
    await speakAndWait(title + '. ' + body, ctx.cancel);
    await delay(450, ctx.cancel);
  }
}

async function openApp(appId: AppId, title: string, ctx: TourContext, payload?: WindowPayload) {
  useOSStore.getState().openWindow(appId, title, payload);
  await delay(600, ctx.cancel);
}

async function clickDockIcon(appId: AppId, ctx: TourContext) {
  const el = document.querySelector(`[data-tour-id="dock-${appId}"]`) as HTMLElement | null;
  if (el) {
    const r = el.getBoundingClientRect();
    await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
    await delay(600, ctx.cancel);
  } else {
    const reg = (await import('./appRegistry')).appRegistry.find((a) => a.id === appId);
    await openApp(appId, reg?.title ?? appId, ctx);
  }
}

async function hoverTourTarget(id: string, ctx: TourContext, holdMs = 2000) {
  const el = document.querySelector(`[data-tour-id="${id}"]`) as HTMLElement | null;
  if (!el) { await delay(holdMs, ctx.cancel); return; }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(250, ctx.cancel);
  const r = el.getBoundingClientRect();
  await ctx.cursor.current?.moveTo(r.left + r.width / 2, r.top + Math.min(70, r.height / 2), 500);
  await delay(holdMs, ctx.cancel);
}

async function scrollToTarget(selector: string, ctx: TourContext) {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(250, ctx.cancel);
}

/** Click the traffic-light Close on the topmost dialog window (not lightbox). */
async function closeTopWindow(ctx: TourContext) {
  const all = [...document.querySelectorAll('button[aria-label="Close"]')] as HTMLElement[];
  const windowClose = all.filter((b) => {
    let el: HTMLElement | null = b;
    while (el) { if (el.getAttribute('role') === 'dialog') return true; el = el.parentElement; }
    return false;
  }).at(-1) ?? all.at(-1);
  if (!windowClose) return;
  const r = windowClose.getBoundingClientRect();
  await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
  await delay(330, ctx.cancel);
}

async function idleDrift(ctx: TourContext, durationMs = 1300) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2 - 60;
  await ctx.cursor.current?.moveTo(cx, cy, 650);
  await delay(durationMs, ctx.cancel);
}

// ── Tour Steps ────────────────────────────────────────────────────────────────

export async function runTourScript(ctx: TourContext) {
  try {
    // ── Step 0: Welcome ──────────────────────────────────────────────────────
    await narrate(0,
      "Quick walkthrough of Aditya's work.",
      "Startup, projects, research, competitions. About 60 seconds.",
      ctx, 3000
    );
    await idleDrift(ctx, 500);

    // ── Step 1: Founder HQ ───────────────────────────────────────────────────
    await narrate(1,
      "He co-founded Tokenistt.",
      "LLM observability and governance platform for engineering teams. Applied to Y Combinator S26.",
      ctx, 2500
    );
    await clickDockIcon('founder-hq', ctx);

    await hoverTourTarget('fhq-tokenistt', ctx, 400);
    await narrate(1,
      "What it does.",
      "Companies shipping AI to production have no visibility into costs, failures, or model behaviour. Tokenistt adds token analytics, model routing, and governance controls.",
      ctx, 2500
    );

    await hoverTourTarget('fhq-roadmap', ctx, 400);
    await narrate(1,
      "Current status.",
      "MVP shipped. Enterprise controls in progress. YC S26 application submitted.",
      ctx, 2000
    );

    await hoverTourTarget('fhq-traction', ctx, 400);
    await closeTopWindow(ctx);

    // ── Step 2: Projects ─────────────────────────────────────────────────────
    await narrate(2,
      "Projects.",
      "Production-grade software, not side projects.",
      ctx, 1500
    );
    await openApp('github', 'Projects', ctx);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    await ctx.cursor.current?.moveTo(cx - 250, cy - 120, 650);
    await narrate(2,
      "TalkWithDB.",
      "Natural language to SQL. Type a question, get live query results. Built with RAG and LLMs on a FastAPI backend.",
      ctx, 2000
    );

    await ctx.cursor.current?.moveTo(cx + 250, cy + 80, 650);
    await narrate(2,
      "Sanjivani.",
      "AI diagnostic assistant. Reads medical records using OCR and NER. Built for a national hackathon and pitched to hospitals.",
      ctx, 2000
    );
    await closeTopWindow(ctx);

    // ── Step 3: Research ─────────────────────────────────────────────────────
    await narrate(3,
      "Research.",
      "Published peer-reviewed papers in applied machine learning.",
      ctx, 1800
    );
    await openApp('research-center', 'Research Center', ctx);

    await hoverTourTarget('rc-publications', ctx, 400);
    await narrate(3,
      "Best Poster Award.",
      "Won at a national research conference for applied ML work.",
      ctx, 1800
    );

    await scrollToTarget('[data-tour-id="rc-certifications"]', ctx);
    await hoverTourTarget('rc-certifications', ctx, 400);
    await narrate(3,
      "Certifications.",
      "AWS, Google Cloud, machine learning, deep learning, cybersecurity.",
      ctx, 1800
    );
    await closeTopWindow(ctx);

    // ── Step 4: Gallery ──────────────────────────────────────────────────────
    await narrate(4,
      "Competition photos.",
      "Real events, real wins.",
      ctx, 1500
    );
    await openApp('photos', 'Photos', ctx, { photoIndex: 1 });
    await delay(650, ctx.cancel);

    // Track which photo is currently visible so we click Next the right number of times
    let photoIdx = 1;

    async function showPhoto(targetIndex: number, title: string, body: string) {
      const clicks = targetIndex - photoIdx;
      for (let i = 0; i < clicks; i++) {
        const nextBtn = document.querySelector('button[aria-label="Next"]') as HTMLElement | null;
        if (!nextBtn) break;
        const nr = nextBtn.getBoundingClientRect();
        await ctx.cursor.current?.click(nr.left + nr.width / 2, nr.top + nr.height / 2);
        await delay(330, ctx.cancel);
      }
      photoIdx = targetIndex;
      await delay(200, ctx.cancel);
      await narrate(4, title, body, ctx, 2000);
    }

    // Photo index 1 — thinktank-win
    await narrate(4,
      "IEEE Think Tank 2026.",
      "National-level IEEE competition. First place.",
      ctx, 2000
    );

    // Photo index 4 — ministry-hackathon-win
    await showPhoto(4,
      "Ministry of Tribal Affairs hackathon.",
      "Government of India organised. First place."
    );

    // Photo index 6 — ministry-cheque
    await showPhoto(6,
      "Government grant.",
      "Official cheque from the Ministry of Tribal Affairs."
    );

    // Photo index 10 — ai-fusion-win
    await showPhoto(10,
      "AI Fusion 2026.",
      "National AI hackathon. First place against IIT and NIT teams."
    );

    // Photo index 15 — best-research-paper-award
    await showPhoto(15,
      "Best Research Paper Award.",
      "Selected at a national academic conference."
    );

    // Photo index 18 — pitching-education-minister
    await showPhoto(18,
      "Pitched to India's Education Minister.",
      "Live product demo at a government event."
    );

    // Close lightbox first, then the window
    const closeLightbox = [...document.querySelectorAll('button[aria-label="Close"]')]
      .find((b) => {
        let el: HTMLElement | null = b as HTMLElement;
        while (el) { if (el.getAttribute('role') === 'dialog') return false; el = el.parentElement; }
        return true;
      }) as HTMLElement | undefined;
    if (closeLightbox) {
      const lr = closeLightbox.getBoundingClientRect();
      await ctx.cursor.current?.click(lr.left + lr.width / 2, lr.top + lr.height / 2);
      await delay(330, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 5: Achievements ─────────────────────────────────────────────────
    await narrate(5,
      "Competition record.",
      "Six national wins total.",
      ctx, 1500
    );
    await openApp('notes', 'Notes', ctx, { section: 'competitions' });
    await delay(400, ctx.cancel);

    await hoverTourTarget('notes-competitions-card', ctx, 400);
    await narrate(5,
      "IEEE Think Tank, Ministry of Tribal Affairs, Smart India Hackathon finalist.",
      "AWS AI for Bharat international top-five. CanHacks international finalist.",
      ctx, 2500
    );
    await closeTopWindow(ctx);

    // ── Step 6: Game ─────────────────────────────────────────────────────────
    await narrate(6,
      "He also built a game.",
      "Hackathon Rush — pixel-art endless runner.",
      ctx, 1500
    );
    await openApp('hackathon-rush', 'Jumping Game', ctx);
    await delay(650, ctx.cancel);

    const canvas = document.querySelector('[data-tour-id="hackathon-canvas"]') as HTMLElement | null;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(cr.left + cr.width / 2, cr.top + cr.height / 2, 530);
    }
    await narrate(6,
      "Built from scratch in TypeScript.",
      "Custom physics engine, canvas rendering, sprite animation. No game engine used.",
      ctx, 2000
    );
    for (let i = 0; i < 6; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      await delay(80, ctx.cancel);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      await delay(870, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 7: Resume ───────────────────────────────────────────────────────
    await narrate(7,
      "Full resume.",
      "Every role, project, and publication on one page. Download available on the next screen.",
      ctx, 2000
    );
    await openApp('resume', 'Resume', ctx);
    await delay(1800, ctx.cancel);
    await closeTopWindow(ctx);

    // ── Step 8: Final ────────────────────────────────────────────────────────
    await narrate(8,
      "That's the overview.",
      "Startup, research, government wins, international competitions. If you'd like to work together, reach out.",
      ctx, 2500
    );
    const store = useOSStore.getState();
    store.windows.forEach((w) => store.closeWindow(w.id));
    await delay(530, ctx.cancel);
    useTourStore.getState()._finish();

  } catch (e: unknown) {
    stopAudio();
    if (e instanceof Error && e.message === 'tour-cancelled') return;
    throw e;
  }
}
