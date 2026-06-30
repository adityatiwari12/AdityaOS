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

/** Sweep cursor across a bounding box in a reading/scanning pattern. */
async function scanArea(x1: number, y1: number, x2: number, y2: number, ctx: TourContext) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  await ctx.cursor.current?.moveTo(x1 + (x2 - x1) * 0.2, my - 40, 400);
  await delay(180, ctx.cancel);
  await ctx.cursor.current?.moveTo(x1 + (x2 - x1) * 0.75, my - 20, 350);
  await delay(150, ctx.cancel);
  await ctx.cursor.current?.moveTo(mx, my + 30, 300);
  await delay(120, ctx.cancel);
}

/** Small random drift — makes cursor feel alive while narrating. */
async function nudge(ctx: TourContext) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const offsets = [[-60, -30], [80, 20], [-40, 50], [60, -40]];
  for (const [dx, dy] of offsets) {
    await ctx.cursor.current?.moveTo(cx + dx, cy + dy, 300);
    await delay(120, ctx.cancel);
  }
}

// ── Tour Steps ────────────────────────────────────────────────────────────────

export async function runTourScript(ctx: TourContext) {
  try {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Step 0: Welcome ──────────────────────────────────────────────────────
    await narrate(0,
      "Quick walkthrough of Aditya's work.",
      "Startup, projects, research, competitions. About 60 seconds.",
      ctx, 3000
    );
    await nudge(ctx);

    // ── Step 1: Founder HQ ───────────────────────────────────────────────────
    await narrate(1,
      "He co-founded Tokenistt.",
      "LLM observability and governance platform for engineering teams. Applied to Y Combinator S26.",
      ctx, 2500
    );
    await clickDockIcon('founder-hq', ctx);

    // Scan the window before hovering targets
    await scanArea(W * 0.15, H * 0.2, W * 0.85, H * 0.75, ctx);

    await hoverTourTarget('fhq-tokenistt', ctx, 300);
    await narrate(1,
      "What it does.",
      "Companies shipping AI to production have no visibility into costs, failures, or model behaviour. Tokenistt adds token analytics, model routing, and governance controls.",
      ctx, 2500
    );

    await hoverTourTarget('fhq-roadmap', ctx, 300);
    await narrate(1,
      "Current status.",
      "MVP shipped. Enterprise controls in progress. YC S26 application submitted.",
      ctx, 2000
    );

    await hoverTourTarget('fhq-traction', ctx, 300);
    // Cursor sweeps across traction section before closing
    await ctx.cursor.current?.moveTo(W * 0.4, H * 0.6, 350);
    await delay(150, ctx.cancel);
    await ctx.cursor.current?.moveTo(W * 0.65, H * 0.55, 300);
    await delay(150, ctx.cancel);
    await closeTopWindow(ctx);

    // ── Step 2: Projects ─────────────────────────────────────────────────────
    await narrate(2,
      "Projects.",
      "Production-grade software, not side projects.",
      ctx, 1500
    );
    await openApp('github', 'Projects', ctx);
    const cx = W / 2;
    const cy = H / 2;

    // Cursor explores the projects grid
    await ctx.cursor.current?.moveTo(cx - 280, cy - 130, 500);
    await delay(150, ctx.cancel);
    await narrate(2,
      "TalkWithDB.",
      "Natural language to SQL. Type a question, get live query results. Built with RAG and LLMs on a FastAPI backend.",
      ctx, 2000
    );

    await ctx.cursor.current?.moveTo(cx + 50, cy - 130, 400);
    await delay(100, ctx.cancel);
    await ctx.cursor.current?.moveTo(cx + 280, cy - 130, 350);
    await delay(100, ctx.cancel);
    await ctx.cursor.current?.moveTo(cx - 280, cy + 80, 400);
    await delay(100, ctx.cancel);
    await narrate(2,
      "Sanjivani.",
      "AI diagnostic assistant. Reads medical records using OCR and NER. Built for a national hackathon and pitched to hospitals.",
      ctx, 2000
    );

    // Sweep remaining cards
    await ctx.cursor.current?.moveTo(cx + 50, cy + 80, 350);
    await delay(100, ctx.cancel);
    await ctx.cursor.current?.moveTo(cx + 280, cy + 80, 350);
    await delay(100, ctx.cancel);
    await closeTopWindow(ctx);

    // ── Step 3: Research ─────────────────────────────────────────────────────
    await narrate(3,
      "Research.",
      "Published peer-reviewed papers in applied machine learning.",
      ctx, 1800
    );
    await openApp('research-center', 'Research Center', ctx);
    await scanArea(W * 0.2, H * 0.25, W * 0.8, H * 0.65, ctx);

    await hoverTourTarget('rc-publications', ctx, 300);
    await narrate(3,
      "Best Poster Award.",
      "Won at a national research conference for applied ML work.",
      ctx, 1800
    );

    await scrollToTarget('[data-tour-id="rc-certifications"]', ctx);
    await hoverTourTarget('rc-certifications', ctx, 300);
    // Cursor reads across cert badges
    await ctx.cursor.current?.moveTo(W * 0.3, H * 0.6, 300);
    await delay(120, ctx.cancel);
    await ctx.cursor.current?.moveTo(W * 0.55, H * 0.6, 280);
    await delay(120, ctx.cancel);
    await ctx.cursor.current?.moveTo(W * 0.7, H * 0.6, 260);
    await delay(120, ctx.cancel);
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
      // Cursor drifts over the photo during narration
      await ctx.cursor.current?.moveTo(W * 0.45, H * 0.4, 300);
      await narrate(4, title, body, ctx, 2000);
    }

    // Photo 1 — cursor scans the lightbox
    await ctx.cursor.current?.moveTo(W * 0.35, H * 0.38, 400);
    await delay(120, ctx.cancel);
    await ctx.cursor.current?.moveTo(W * 0.6, H * 0.42, 350);
    await delay(120, ctx.cancel);
    await narrate(4,
      "IEEE Think Tank 2026.",
      "National-level IEEE competition. First place.",
      ctx, 2000
    );

    await showPhoto(4, "Ministry of Tribal Affairs hackathon.", "Government of India organised. First place.");
    await showPhoto(6, "Government grant.", "Official cheque from the Ministry of Tribal Affairs.");
    await showPhoto(10, "AI Fusion 2026.", "National AI hackathon. First place against IIT and NIT teams.");
    await showPhoto(15, "Best Research Paper Award.", "Selected at a national academic conference.");
    await showPhoto(18, "Pitched to India's Education Minister.", "Live product demo at a government event.");

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

    await hoverTourTarget('notes-competitions-card', ctx, 300);
    // Cursor sweeps down the list
    const notesEl = document.querySelector('[data-tour-id="notes-competitions-card"]');
    if (notesEl) {
      const nr = notesEl.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(nr.left + nr.width * 0.3, nr.top + 30, 300);
      await delay(120, ctx.cancel);
      await ctx.cursor.current?.moveTo(nr.left + nr.width * 0.6, nr.top + 70, 280);
      await delay(120, ctx.cancel);
      await ctx.cursor.current?.moveTo(nr.left + nr.width * 0.4, nr.top + 110, 260);
      await delay(120, ctx.cancel);
    }
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
    await delay(1200, ctx.cancel);

    const canvas = document.querySelector('[data-tour-id="hackathon-canvas"]') as HTMLElement | null;
    let canvasCx = W / 2, canvasCy = H / 2;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      canvasCx = cr.left + cr.width / 2;
      canvasCy = cr.top + cr.height / 2;
      await ctx.cursor.current?.moveTo(canvasCx, canvasCy, 500);
    }

    await narrate(6,
      "Built from scratch in TypeScript.",
      "Custom physics engine, canvas rendering, sprite animation. No game engine used.",
      ctx, 2000
    );

    // Press Enter to START the game from splash screen
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    await delay(80, ctx.cancel);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter', key: 'Enter', bubbles: true }));
    await delay(800, ctx.cancel); // wait for game to start running

    // Jump 7 times — cursor moves like it's "playing"
    const jumpPositions = [
      [canvasCx - 80, canvasCy + 40],
      [canvasCx + 60, canvasCy - 30],
      [canvasCx - 40, canvasCy + 20],
      [canvasCx + 100, canvasCy - 50],
      [canvasCx - 100, canvasCy + 60],
      [canvasCx + 50, canvasCy - 20],
      [canvasCx, canvasCy + 10],
    ];
    for (let i = 0; i < 7; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      await delay(80, ctx.cancel);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      const [jx, jy] = jumpPositions[i];
      await ctx.cursor.current?.moveTo(jx, jy, 250);
      await delay(620, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 7: Resume ───────────────────────────────────────────────────────
    await narrate(7,
      "Full resume.",
      "Every role, project, and publication on one page. Download available on the next screen.",
      ctx, 2000
    );
    await openApp('resume', 'Resume', ctx);
    // Cursor scans the resume
    await ctx.cursor.current?.moveTo(W * 0.35, H * 0.3, 500);
    await delay(200, ctx.cancel);
    await ctx.cursor.current?.moveTo(W * 0.6, H * 0.45, 400);
    await delay(200, ctx.cancel);
    await ctx.cursor.current?.moveTo(W * 0.4, H * 0.6, 350);
    await delay(200, ctx.cancel);
    await delay(1000, ctx.cancel);
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
