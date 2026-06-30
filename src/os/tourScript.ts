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
    // poll cancel so skip is instant
    const poll = setInterval(() => { if (cancel.cancelled) { clearInterval(poll); clearTimeout(t); rej(new Error('tour-cancelled')); } }, 50);
    // cleanup poll on normal resolve
    setTimeout(() => clearInterval(poll), ms + 100);
  });
}

function advance(step: number, title: string, body: string) {
  useTourStore.getState()._advance(step, title, body);
}

async function openApp(appId: AppId, title: string, ctx: TourContext, payload?: WindowPayload) {
  useOSStore.getState().openWindow(appId, title, payload);
  await delay(700, ctx.cancel);
}

async function clickDockIcon(appId: AppId, ctx: TourContext) {
  const el = document.querySelector(`[data-tour-id="dock-${appId}"]`) as HTMLElement | null;
  if (el) {
    const r = el.getBoundingClientRect();
    await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
    await delay(700, ctx.cancel);
  } else {
    // fallback: open directly if dock icon not found
    const { title } = (await import('./appRegistry')).appRegistry.find((a) => a.id === appId) ?? { title: appId };
    await openApp(appId, title, ctx);
  }
}

async function hoverTourTarget(id: string, ctx: TourContext, holdMs = 2000) {
  const el = document.querySelector(`[data-tour-id="${id}"]`) as HTMLElement | null;
  if (!el) { await delay(holdMs, ctx.cancel); return; }
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = Math.min(r.top + 60, r.top + r.height / 2);
  await ctx.cursor.current?.moveTo(x, y, 700);
  await delay(holdMs, ctx.cancel);
}

async function closeTopWindow(ctx: TourContext) {
  // Click the topmost visible Close traffic-light (last in DOM order = highest z)
  const btns = [...document.querySelectorAll('[aria-label="Close"]')] as HTMLElement[];
  const btn = btns.at(-1);
  if (!btn) { return; }
  const r = btn.getBoundingClientRect();
  await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
  await delay(400, ctx.cancel);
}

async function idleDrift(ctx: TourContext, durationMs = 2000) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  await ctx.cursor.current?.moveTo(cx, cy, 900);
  await delay(durationMs, ctx.cancel);
}

// ── Tour Steps ────────────────────────────────────────────────────────────────

export async function runTourScript(ctx: TourContext) {
  const go = (s: number, t: string, b: string) => advance(s, t, b);
  try {
    // Step 0 — Welcome
    go(0, 'Hi! I\'m Aditya\'s AI assistant.', 'Let me show you everything important in under 90 seconds.');
    await idleDrift(ctx, 4500);

    // Step 1 — Founder HQ
    go(1, 'Tokenistt — the startup.', 'We\'re building the operating system for production AI: monitor, govern, and trust every AI system your company runs.');
    await clickDockIcon('founder-hq', ctx);
    await hoverTourTarget('fhq-tokenistt', ctx, 2500);
    await hoverTourTarget('fhq-roadmap', ctx, 2000);
    await hoverTourTarget('fhq-metrics', ctx, 1500);
    await hoverTourTarget('fhq-traction', ctx, 1500);
    await closeTopWindow(ctx);

    // Step 2 — Projects
    go(2, 'Projects — what I\'ve shipped.', 'Full-stack apps across AI, FinTech, and healthcare. Each one solving a real problem.');
    await openApp('github', 'Projects', ctx);
    await delay(800, ctx.cancel);
    // drift cursor across project list area
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    await ctx.cursor.current?.moveTo(cx - 200, cy - 80, 800);
    await delay(1800, ctx.cancel);
    await ctx.cursor.current?.moveTo(cx + 200, cy, 800);
    await delay(1800, ctx.cancel);
    await ctx.cursor.current?.moveTo(cx - 100, cy + 100, 600);
    await delay(1500, ctx.cancel);
    await closeTopWindow(ctx);

    // Step 3 — Research
    go(3, 'Research & publications.', 'Peer-reviewed papers, Best Poster Award, and certified expertise across AI and cloud.');
    await openApp('research-center', 'Research Center', ctx);
    await hoverTourTarget('rc-publications', ctx, 2500);
    await hoverTourTarget('rc-certifications', ctx, 2000);
    await closeTopWindow(ctx);

    // Step 4 — Gallery
    go(4, 'The journey — in pictures.', 'Hackathons, government pitches, conferences, and wins across the country.');
    await openApp('photos', 'Photos', ctx);
    await delay(400, ctx.cancel);
    const thumbIndices = [0, 4, 10, 12];
    for (const idx of thumbIndices) {
      const thumb = document.querySelector(`[data-tour-gallery-thumb="${idx}"]`) as HTMLElement | null;
      if (thumb) {
        const r = thumb.getBoundingClientRect();
        await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
        await delay(1800, ctx.cancel);
        // click Next arrow in lightbox if present
        const nextBtn = document.querySelector('[aria-label="Next photo"]') as HTMLElement | null;
        if (nextBtn) {
          const nr = nextBtn.getBoundingClientRect();
          await ctx.cursor.current?.click(nr.left + nr.width / 2, nr.top + nr.height / 2);
          await delay(600, ctx.cancel);
        }
        // close lightbox
        const closeLight = document.querySelector('[aria-label="Close lightbox"]') as HTMLElement | null;
        if (closeLight) {
          const lr = closeLight.getBoundingClientRect();
          await ctx.cursor.current?.click(lr.left + lr.width / 2, lr.top + lr.height / 2);
          await delay(400, ctx.cancel);
        }
      }
    }
    await closeTopWindow(ctx);

    // Step 5 — Achievements
    go(5, '6× National Hackathon Winner.', 'IEEE wins, Ministry of Tribal Affairs, Smart India Hackathon Finalist, and international top-5 finishes.');
    await openApp('notes', 'Notes', ctx, { section: 'competitions' });
    await hoverTourTarget('notes-competitions-card', ctx, 3000);
    // drift down through competition list
    const notesEl = document.querySelector('[data-tour-id="notes-competitions-card"]');
    if (notesEl) {
      const r = notesEl.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(r.left + r.width / 2, r.top + r.height + 100, 800);
      await delay(1500, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // Step 6 — Hackathon Rush
    go(6, 'Oh, and I built a game too.', 'Hackathon Rush — built it between competitions. Press Space, don\'t crash.');
    await openApp('hackathon-rush', 'Jumping Game', ctx);
    await delay(800, ctx.cancel);
    const canvas = document.querySelector('[data-tour-id="hackathon-canvas"]') as HTMLElement | null;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(cr.left + cr.width / 2, cr.top + cr.height / 2, 600);
    }
    // Simulate space presses to start + play for ~7s
    for (let i = 0; i < 6; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      await delay(80, ctx.cancel);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      await delay(1200, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // Step 7 — Resume
    go(7, 'Everything in one view.', 'The full resume — skills, experience, education, and achievements.');
    await openApp('resume', 'Resume', ctx);
    await delay(4500, ctx.cancel);
    await closeTopWindow(ctx);

    // Step 8 — Final
    go(8, 'That\'s the 90-second tour.', 'You\'ve seen the startup, projects, research, achievements, and a game. If we\'d build great things together — reach out.');
    // Close any remaining open windows
    const store = useOSStore.getState();
    store.windows.forEach((w) => store.closeWindow(w.id));
    await delay(600, ctx.cancel);
    useTourStore.getState()._finish();

  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'tour-cancelled') {
      // clean up any orphan windows from the tour
      return;
    }
    throw e;
  }
}
