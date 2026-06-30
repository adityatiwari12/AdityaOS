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
  await delay(800, ctx.cancel);
}

async function clickDockIcon(appId: AppId, ctx: TourContext) {
  const el = document.querySelector(`[data-tour-id="dock-${appId}"]`) as HTMLElement | null;
  if (el) {
    const r = el.getBoundingClientRect();
    await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
    await delay(800, ctx.cancel);
  } else {
    const reg = (await import('./appRegistry')).appRegistry.find((a) => a.id === appId);
    await openApp(appId, reg?.title ?? appId, ctx);
  }
}

/** Scroll element into view then move cursor to its center. */
async function hoverTourTarget(id: string, ctx: TourContext, holdMs = 2200) {
  const el = document.querySelector(`[data-tour-id="${id}"]`) as HTMLElement | null;
  if (!el) { await delay(holdMs, ctx.cancel); return; }
  // Scroll it into view first so getBoundingClientRect() returns visible coords
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(350, ctx.cancel); // wait for scroll to settle
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + Math.min(60, r.height / 2);
  await ctx.cursor.current?.moveTo(x, y, 700);
  await delay(holdMs, ctx.cancel);
}

/** Scroll a scrollable ancestor of a tour-target into view. */
async function scrollWindowContent(selector: string, ctx: TourContext) {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  await delay(350, ctx.cancel);
}

async function closeTopWindow(ctx: TourContext) {
  // Exclude MediaGallery lightbox Close buttons; target only traffic-light Closes
  // Traffic-light Close is inside a header element — pick buttons NOT inside an overlay lightbox
  const btns = [...document.querySelectorAll('button[aria-label="Close"]')] as HTMLElement[];
  // Find the one inside a window header (not inside a fixed inset-0 overlay)
  const windowClose = btns.filter((b) => {
    let el: HTMLElement | null = b;
    while (el) {
      if (el.getAttribute('role') === 'dialog') return true;
      el = el.parentElement;
    }
    return false;
  }).at(-1) ?? btns.at(-1);
  if (!windowClose) return;
  const r = windowClose.getBoundingClientRect();
  await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
  await delay(450, ctx.cancel);
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
    go(0,
      "Hi! I'm Aditya's AI assistant.",
      "Welcome to AdityaOS. I'll walk you through everything that matters — projects, research, startup, achievements — in under 90 seconds. Sit back and watch."
    );
    await idleDrift(ctx, 5000);

    // Step 1 — Founder HQ
    go(1,
      "Tokenistt — Aditya's startup.",
      "Tokenistt is an AI operating system for enterprises. It monitors, governs, and makes production AI systems reliable at scale. Aditya is Co-Founder and CPO, and the company is a YC Summer 2026 applicant."
    );
    await clickDockIcon('founder-hq', ctx);
    await hoverTourTarget('fhq-tokenistt', ctx, 2800);
    await hoverTourTarget('fhq-roadmap', ctx, 2200);
    await hoverTourTarget('fhq-metrics', ctx, 2000);
    await hoverTourTarget('fhq-traction', ctx, 1800);
    await closeTopWindow(ctx);

    // Step 2 — Projects
    go(2,
      "What Aditya actually ships.",
      "Full-stack projects spanning AI, FinTech, and healthcare. TalkWithDB lets you query databases in plain English. Sanjivani is an AI-powered healthcare platform. Each project is production-grade, not a tutorial clone."
    );
    await openApp('github', 'Projects', ctx);
    await delay(600, ctx.cancel);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    await ctx.cursor.current?.moveTo(cx - 220, cy - 100, 900);
    await delay(2000, ctx.cancel);
    await ctx.cursor.current?.moveTo(cx + 220, cy + 60, 900);
    await delay(2000, ctx.cancel);
    await ctx.cursor.current?.moveTo(cx, cy + 160, 700);
    await delay(1800, ctx.cancel);
    await closeTopWindow(ctx);

    // Step 3 — Research
    go(3,
      "Research & peer-reviewed publications.",
      "Aditya has published research in AI and machine learning at national conferences. His work earned a Best Poster Award. He's also certified across AWS, Google Cloud, and multiple AI frameworks."
    );
    await openApp('research-center', 'Research Center', ctx);
    await hoverTourTarget('rc-publications', ctx, 2800);
    await scrollWindowContent('[data-tour-id="rc-certifications"]', ctx);
    await hoverTourTarget('rc-certifications', ctx, 2200);
    await closeTopWindow(ctx);

    // Step 4 — Gallery
    go(4,
      "The journey — in pictures.",
      "6 national hackathon wins, pitching to the Education Minister of India, receiving grants from the Ministry of Tribal Affairs, and competing internationally. This is what the grind looks like."
    );
    await openApp('photos', 'Photos', ctx);
    await delay(500, ctx.cancel);
    const thumbIndices = [1, 4, 10, 12, 18];
    for (const idx of thumbIndices) {
      const thumb = document.querySelector(`[data-tour-gallery-thumb="${idx}"]`) as HTMLElement | null;
      if (thumb) {
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        await delay(300, ctx.cancel);
        const r = thumb.getBoundingClientRect();
        await ctx.cursor.current?.click(r.left + r.width / 2, r.top + r.height / 2);
        await delay(2000, ctx.cancel);
        // close lightbox with correct aria-label ("Close" on the lightbox ✕ button)
        const closeLight = [...document.querySelectorAll('button[aria-label="Close"]')]
          .find((b) => {
            // Find one that is inside a fixed overlay (lightbox), not a dialog role element
            let el: HTMLElement | null = b as HTMLElement;
            while (el) {
              if (el.getAttribute('role') === 'dialog') return false;
              el = el.parentElement;
            }
            return true;
          }) as HTMLElement | undefined;
        if (closeLight) {
          const lr = closeLight.getBoundingClientRect();
          await ctx.cursor.current?.click(lr.left + lr.width / 2, lr.top + lr.height / 2);
          await delay(450, ctx.cancel);
        }
      }
    }
    await closeTopWindow(ctx);

    // Step 5 — Achievements
    go(5,
      "Six-time National Hackathon Winner.",
      "IEEE Think Tank 2026, Ministry of Tribal Affairs grant, AI Fusion 1st Place, Smart India Hackathon Finalist, AWS AI for Bharat International Top-5 — these aren't participation trophies. They're wins that came with real funding and government recognition."
    );
    await openApp('notes', 'Notes', ctx, { section: 'competitions' });
    await delay(500, ctx.cancel);
    await hoverTourTarget('notes-competitions-card', ctx, 3200);
    const notesEl = document.querySelector('[data-tour-id="notes-competitions-card"]');
    if (notesEl) {
      const r = notesEl.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(r.left + r.width / 2, r.bottom + 80, 800);
      await delay(1800, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // Step 6 — Hackathon Rush
    go(6,
      "Oh — and he built a game too.",
      "Hackathon Rush is a pixel-art endless runner Aditya built from scratch during the hackathon grind. Canvas-based, 60fps, full game engine in TypeScript. Watch."
    );
    await openApp('hackathon-rush', 'Jumping Game', ctx);
    await delay(1000, ctx.cancel);
    const canvas = document.querySelector('[data-tour-id="hackathon-canvas"]') as HTMLElement | null;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(cr.left + cr.width / 2, cr.top + cr.height / 2, 700);
    }
    for (let i = 0; i < 7; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      await delay(80, ctx.cancel);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      await delay(1200, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // Step 7 — Resume
    go(7,
      "Everything distilled to one page.",
      "The full resume — every role, skill, publication, and achievement at a glance. Available to download right now from the final screen."
    );
    await openApp('resume', 'Resume', ctx);
    await delay(4500, ctx.cancel);
    await closeTopWindow(ctx);

    // Step 8 — Final
    go(8,
      "That's the 90-second tour.",
      "You've seen the startup, the projects, the research, and the wins. Aditya is looking for the next big challenge. If that's something you're building — let's talk."
    );
    const store = useOSStore.getState();
    store.windows.forEach((w) => store.closeWindow(w.id));
    await delay(700, ctx.cancel);
    useTourStore.getState()._finish();

  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'tour-cancelled') return;
    throw e;
  }
}
