/**
 * Shared default layout for the three windows that auto-open on every load
 * (Intro, GitHub Activity, Project Videos). These are legacy DraggableWindows
 * that each set their own position, so this keeps them in one tidy, non-messy
 * two-column arrangement that clears the left profile widget and the dock.
 *
 *   ┌── profile ──┐ ┌─ Intro ───────┐ ┌─ Project Videos ─┐
 *   │             │ └───────────────┘ │                  │
 *   │             │ ┌─ GitHub ──────┐ │                  │
 *   └─────────────┘ └───────────────┘ └──────────────────┘
 */

export type DefaultWindowKey = 'intro' | 'contributions' | 'videos';

interface WindowLayout {
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Mirrors the responsive layout below for a typical 1200×800 desktop so the
// first (pre-measure) paint matches the client arrangement and never overflows.
const SSR_FALLBACK: Record<DefaultWindowKey, WindowLayout> = {
  intro: { position: { x: 296, y: 70 }, size: { width: 410, height: 302 } },
  contributions: { position: { x: 296, y: 388 }, size: { width: 410, height: 302 } },
  videos: { position: { x: 722, y: 70 }, size: { width: 462, height: 620 } },
};

export function defaultWindowLayout(key: DefaultWindowKey): WindowLayout {
  if (typeof window === 'undefined') return SSR_FALLBACK[key];

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Profile widget is rendered from `lg` (1024px) at left-5, width 16rem.
  const hasProfile = w >= 1024;
  const left = hasProfile ? 296 : 16;
  const top = 70;
  const gap = 16;
  const rightMargin = 16;
  const bottomReserve = 110; // leave room for the dock

  const available = Math.max(320, w - left - rightMargin);
  const colR = Math.min(520, Math.max(360, available * 0.52)); // Project Videos
  const colL = Math.max(300, available - colR - gap); // Intro + GitHub stack
  const workH = Math.max(360, h - top - bottomReserve);
  const stackH = Math.floor((workH - gap) / 2);

  switch (key) {
    case 'intro':
      return {
        position: { x: left, y: top },
        size: { width: Math.floor(colL), height: stackH },
      };
    case 'contributions':
      return {
        position: { x: left, y: top + stackH + gap },
        size: { width: Math.floor(colL), height: stackH },
      };
    case 'videos':
      return {
        position: { x: Math.floor(left + colL + gap), y: top },
        size: { width: Math.floor(colR), height: workH },
      };
  }
}
