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
async function narrate(step: number, title: string, body: string, ctx: TourContext, mutedHoldMs = 4000) {
  advance(step, title, body);
  if (useTourStore.getState().muted) {
    await delay(mutedHoldMs, ctx.cancel);
  } else {
    await speakAndWait(title + '. ' + body, ctx.cancel);
    await delay(700, ctx.cancel);
  }
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

async function hoverTourTarget(id: string, ctx: TourContext, holdMs = 3000) {
  const el = document.querySelector(`[data-tour-id="${id}"]`) as HTMLElement | null;
  if (!el) { await delay(holdMs, ctx.cancel); return; }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(400, ctx.cancel);
  const r = el.getBoundingClientRect();
  await ctx.cursor.current?.moveTo(r.left + r.width / 2, r.top + Math.min(70, r.height / 2), 800);
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

// ── Tour Steps ────────────────────────────────────────────────────────────────

export async function runTourScript(ctx: TourContext) {
  try {
    // ── Step 0: Welcome ──────────────────────────────────────────────────────
    await narrate(0,
      "Hey there — welcome.",
      "I'm Aditya's personal guide here. Over the next couple of minutes, I'll show you his work, the startup he's building, his research, and some wins that are honestly pretty hard to believe for someone his age. You don't need to click anything — just sit back.",
      ctx, 7000
    );
    await idleDrift(ctx, 1000);

    // ── Step 1: Founder HQ ───────────────────────────────────────────────────
    await narrate(1,
      "Okay, let's start with the startup.",
      "Aditya isn't just an engineer who codes for fun. He's also building something. Let me show you.",
      ctx, 3500
    );
    await clickDockIcon('founder-hq', ctx);

    await hoverTourTarget('fhq-tokenistt', ctx, 600);
    await narrate(1,
      "This is Tokenistt.",
      "Here's the problem: companies are shipping AI to production, but they have zero visibility into what it's actually doing. Costs spiral, models hallucinate, and no one knows why. Tokenistt is the control room. Token analytics, model routing, governance — the stuff enterprises desperately need but nobody's built properly yet.",
      ctx, 3500
    );

    await hoverTourTarget('fhq-roadmap', ctx, 600);
    await narrate(1,
      "And they're moving fast.",
      "MVP shipped. Enterprise governance controls are mid-build right now. They've applied to Y Combinator Summer 2026 — so if you're reading this post-acceptance, hi from the past.",
      ctx, 3500
    );

    await hoverTourTarget('fhq-metrics', ctx, 600);
    await narrate(1,
      "The numbers are early, but they're real.",
      "No vanity metrics here. Real users, real feedback. The kind of traction you get when you actually talk to customers before you build.",
      ctx, 3000
    );

    await hoverTourTarget('fhq-traction', ctx, 600);
    await closeTopWindow(ctx);

    // ── Step 2: Projects ─────────────────────────────────────────────────────
    await narrate(2,
      "Now — the projects.",
      "Fair warning: these aren't todo apps or CRUD starters. Every single one of these was built to solve a real problem.",
      ctx, 3000
    );
    await openApp('github', 'Projects', ctx);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    await ctx.cursor.current?.moveTo(cx - 250, cy - 120, 1000);
    await narrate(2,
      "TalkWithDB — and yes, it actually works.",
      "You type a question in plain English. It generates the SQL, runs it against your database, and shows you live results. RAG, LLMs, FastAPI backend. Real users use this to query real production databases.",
      ctx, 3500
    );

    await ctx.cursor.current?.moveTo(cx + 250, cy + 80, 1000);
    await narrate(2,
      "Sanjivani — AI for healthcare.",
      "An AI diagnostic assistant that reads medical records using OCR, Named Entity Recognition, and deep learning. He built this for a national hackathon and then pitched it to actual hospitals. Not as a demo — as something they could actually deploy.",
      ctx, 3500
    );

    await ctx.cursor.current?.moveTo(cx - 80, cy + 200, 800);
    await narrate(2,
      "There's a pattern here.",
      "Every project has a real user, a real problem, and real code behind it. Not just GitHub repos that compile once. These are things people actually use.",
      ctx, 3000
    );
    await closeTopWindow(ctx);

    // ── Step 3: Research ─────────────────────────────────────────────────────
    await narrate(3,
      "Alright — research.",
      "Some engineers ship products. Some write papers. Aditya does both, which is rarer than it sounds.",
      ctx, 3000
    );
    await openApp('research-center', 'Research Center', ctx);

    await hoverTourTarget('rc-publications', ctx, 600);
    await narrate(3,
      "Peer-reviewed. And award-winning.",
      "His research paper didn't just get published — it won Best Poster Award at a national conference. That's academics saying: this is the best work in the room. Not engineers. Academics.",
      ctx, 3500
    );

    await scrollToTarget('[data-tour-id="rc-certifications"]', ctx);
    await hoverTourTarget('rc-certifications', ctx, 600);
    await narrate(3,
      "And then there are the certifications.",
      "AWS, Google Cloud, machine learning, deep learning, cybersecurity. This isn't someone who learned one thing deeply and stopped. He's built the kind of breadth that means he can jump into any stack and actually contribute from day one.",
      ctx, 3500
    );
    await closeTopWindow(ctx);

    // ── Step 4: Gallery ──────────────────────────────────────────────────────
    await narrate(4,
      "Okay — this is my favourite part.",
      "The gallery. These are real photos from real events. I'll walk you through them.",
      ctx, 3000
    );
    await openApp('photos', 'Photos', ctx, { photoIndex: 1 });
    await delay(1000, ctx.cancel);

    // Track which photo is currently visible so we click Next the right number of times
    let photoIdx = 1;

    async function showPhoto(targetIndex: number, title: string, body: string) {
      const clicks = targetIndex - photoIdx;
      for (let i = 0; i < clicks; i++) {
        const nextBtn = document.querySelector('button[aria-label="Next"]') as HTMLElement | null;
        if (!nextBtn) break;
        const nr = nextBtn.getBoundingClientRect();
        await ctx.cursor.current?.click(nr.left + nr.width / 2, nr.top + nr.height / 2);
        await delay(500, ctx.cancel);
      }
      photoIdx = targetIndex;
      await delay(300, ctx.cancel);
      await narrate(4, title, body, ctx, 4500);
    }

    // Photo index 1 — thinktank-win (lightbox already open at this photo)
    await narrate(4,
      "IEEE Think Tank 2026. Aditya's team won.",
      "This was a national-level competition run by IEEE. Hundreds of teams. Aditya's team came first. Look at that trophy — it's real. So is that smile.",
      ctx, 5000
    );

    // Photo index 4 — ministry-hackathon-win (3 Next clicks)
    await showPhoto(4,
      "Ministry of Tribal Affairs — and they won this one too.",
      "This wasn't a college hackathon. This was organised by the Government of India. Aditya's team took first place — and what came with that win was something most developers never see."
    );

    // Photo index 6 — ministry-cheque (2 Next clicks)
    await showPhoto(6,
      "Yeah. An actual cheque from the Ministry.",
      "Real money. From the Government of India. Handed to Aditya at an official ceremony. He was twenty years old when this happened."
    );

    // Photo index 10 — ai-fusion-win (4 Next clicks)
    await showPhoto(10,
      "AI Fusion 2026 — first place again.",
      "One of the most competitive AI hackathons in India. Teams from IITs. Teams from NITs. Aditya's team looked at the competition, and still came first."
    );

    // Photo index 15 — best-research-paper-award (5 Next clicks)
    await showPhoto(15,
      "Best Research Paper Award. This one's different.",
      "This isn't a hackathon trophy. This is academic recognition — a room full of researchers, professors, and domain experts, and his paper was selected as the best. That's a different kind of validation."
    );

    // Photo index 18 — pitching-education-minister (3 Next clicks)
    await showPhoto(18,
      "And this... this is something else.",
      "That's Aditya pitching to India's Minister of Education. Live demo. No safety net. This is the kind of room most people don't get into at any age — and he was in it at twenty."
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
      await delay(500, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 5: Achievements ─────────────────────────────────────────────────
    await narrate(5,
      "Let me put that all in one place.",
      "Six national hackathon wins. Let's actually look at them.",
      ctx, 2500
    );
    await openApp('notes', 'Notes', ctx, { section: 'competitions' });
    await delay(600, ctx.cancel);

    await hoverTourTarget('notes-competitions-card', ctx, 600);
    await narrate(5,
      "IEEE Think Tank. Ministry of Tribal Affairs. Smart India Hackathon finalist.",
      "AWS AI for Bharat — international top-five. CanHacks international. These aren't participation certificates. These have real judges, real stakes, and real competition. And he keeps adding to this list.",
      ctx, 3500
    );

    const notesEl = document.querySelector('[data-tour-id="notes-competitions-card"]');
    if (notesEl) {
      const r = notesEl.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(r.left + r.width / 2, r.bottom + 120, 900);
      await narrate(5,
        "It's not luck. It's a pattern.",
        "Every few months, there's a new one. He walks into rooms with the hardest problems, and he figures out a way to solve them faster and better than everyone else. That doesn't happen by accident.",
        ctx, 3500
      );
    }
    await closeTopWindow(ctx);

    // ── Step 6: Game ─────────────────────────────────────────────────────────
    await narrate(6,
      "Okay — one more thing, and I promise this one's fun.",
      "He built a game. An actual game. Between competitions.",
      ctx, 2500
    );
    await openApp('hackathon-rush', 'Jumping Game', ctx);
    await delay(1000, ctx.cancel);

    const canvas = document.querySelector('[data-tour-id="hackathon-canvas"]') as HTMLElement | null;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      await ctx.cursor.current?.moveTo(cr.left + cr.width / 2, cr.top + cr.height / 2, 800);
    }
    await narrate(6,
      "Hackathon Rush. Built entirely from scratch.",
      "Canvas rendering, custom physics engine, sprite animation, collision detection — all in TypeScript. No game engine. No library. Just code. He built this for fun, in the gaps between everything else you just saw.",
      ctx, 3500
    );
    for (let i = 0; i < 8; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      await delay(80, ctx.cancel);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      await delay(1300, ctx.cancel);
    }
    await closeTopWindow(ctx);

    // ── Step 7: Resume ───────────────────────────────────────────────────────
    await narrate(7,
      "And if you want everything on one page —",
      "Here's the resume. Every role, every project, every publication. If you want to download it, there's a button waiting for you on the next screen.",
      ctx, 3500
    );
    await openApp('resume', 'Resume', ctx);
    await delay(3500, ctx.cancel);
    await closeTopWindow(ctx);

    // ── Step 8: Final ────────────────────────────────────────────────────────
    await narrate(8,
      "That's the tour. And honestly — I'm proud of this one.",
      "A startup, original research, government grants, national wins, international finals, and a game built for fun. Aditya's looking for the next big challenge. If you're building something that deserves that — reach out.",
      ctx, 4000
    );
    const store = useOSStore.getState();
    store.windows.forEach((w) => store.closeWindow(w.id));
    await delay(800, ctx.cancel);
    useTourStore.getState()._finish();

  } catch (e: unknown) {
    stopAudio();
    if (e instanceof Error && e.message === 'tour-cancelled') return;
    throw e;
  }
}
