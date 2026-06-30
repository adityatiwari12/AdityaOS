import { create } from 'zustand';
import type { AppId, TimeOfDay, WeatherState, WindowPayload, WindowState } from '../os/types';
import { nextZIndex as nextZ } from '../lib/zIndex';

// Chrome reserved around windows so nothing opens under the menu bar / dock.
const TOP_INSET = 40; // fixed menu bar
const BOTTOM_RESERVE = 110; // dock
const SIDE_MARGIN = 16;

function viewport() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  return { w, h };
}

const IDEAL_SIZES: Partial<Record<AppId, { width: number; height: number }>> = {
  intro: { width: 500, height: 340 },
  videos: { width: 600, height: 460 },
  contributions: { width: 660, height: 340 },
  terminal: { width: 700, height: 500 },
  notes: { width: 680, height: 560 },
  github: { width: 900, height: 600 },
  resume: { width: 640, height: 720 },
  spotify: { width: 400, height: 500 },
  finder: { width: 860, height: 560 },
  'projects-lab': { width: 920, height: 640 },
  'founder-hq': { width: 900, height: 620 },
  'hackathon-museum': { width: 880, height: 580 },
  'research-center': { width: 800, height: 560 },
  'knowledge-base': { width: 860, height: 600 },
  'build-mode': { width: 780, height: 520 },
  'career-control': { width: 900, height: 560 },
  'personal-dashboard': { width: 520, height: 480 },
  analytics: { width: 860, height: 540 },
  collaboration: { width: 480, height: 700 },
  photos: { width: 880, height: 600 },
  'architecture-viewer': { width: 900, height: 620 },
  'hackathon-rush': { width: 9999, height: 9999 },
  'dev-settings': { width: 880, height: 600 },
};

/** A window size that always fits inside the available work area. */
function defaultSize(appId: AppId) {
  const ideal = IDEAL_SIZES[appId] ?? { width: 640, height: 480 };
  const { w, h } = viewport();
  const maxW = Math.max(320, w - SIDE_MARGIN * 2);
  const maxH = Math.max(300, h - TOP_INSET - BOTTOM_RESERVE);
  return {
    width: Math.min(ideal.width, maxW),
    height: Math.min(ideal.height, maxH),
  };
}

/** A position that keeps the whole (clamped) window on screen. */
function defaultPosition(appId: AppId, index: number) {
  const { w, h } = viewport();
  const size = defaultSize(appId);
  const cascadeX = Math.max(300, w * 0.24);
  const offsets: Partial<Record<AppId, { x: number; y: number }>> = {
    contributions: { x: cascadeX, y: 80 },
    videos: { x: cascadeX + 46, y: 126 },
    intro: { x: cascadeX + 92, y: 172 },
    terminal: { x: Math.round((w - size.width) / 2), y: Math.round((h - TOP_INSET - BOTTOM_RESERVE - size.height) / 2) + TOP_INSET },
    notes: { x: w * 0.25, y: 100 },
    github: { x: w * 0.15, y: 120 },
    resume: { x: w * 0.35, y: 100 },
    finder: { x: w * 0.12, y: 80 },
    'projects-lab': { x: w * 0.1, y: 70 },
    'founder-hq': { x: w * 0.08, y: 60 },
    'hackathon-museum': { x: w * 0.05, y: 90 },
    'research-center': { x: w * 0.18, y: 85 },
    'knowledge-base': { x: w * 0.2, y: 75 },
    'build-mode': { x: w * 0.22, y: 95 },
    'career-control': { x: w * 0.15, y: 70 },
    'personal-dashboard': { x: w * 0.28, y: 90 },
    analytics: { x: w * 0.1, y: 85 },
    collaboration: { x: w * 0.2, y: 80 },
    photos: { x: w * 0.18, y: 80 },
    'architecture-viewer': { x: w * 0.12, y: 80 },
    'dev-settings': { x: Math.round((w - size.width) / 2), y: Math.round((h - TOP_INSET - BOTTOM_RESERVE - size.height) / 2) + TOP_INSET },
  };
  const desired = offsets[appId] ?? { x: 80 + index * 24, y: 80 + index * 24 };

  // Clamp so the window never overflows the viewport (right edge / dock).
  const maxX = Math.max(SIDE_MARGIN, w - SIDE_MARGIN - size.width);
  const maxY = Math.max(TOP_INSET, h - BOTTOM_RESERVE - size.height);
  const x = Math.min(Math.max(SIDE_MARGIN, desired.x), maxX);
  const y = Math.min(Math.max(TOP_INSET, desired.y), maxY);
  return { x, y };
}

interface OSStore {
  booted: boolean;
  bootSkipped: boolean;
  timeOfDay: TimeOfDay;
  weather: WeatherState | null;
  wallpaper: string;
  customWallpaper: string | null;
  windows: WindowState[];
  recentApps: AppId[];
  highlightTarget: string | null;
  retroMode: boolean;
  kernelPanic: boolean;
  meetingBooked: boolean;
  mobileOpenOrigins: Record<string, string>;

  setBooted: (v: boolean) => void;
  setBootSkipped: (v: boolean) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  setWeather: (w: WeatherState | null) => void;
  setWallpaper: (w: string) => void;
  setCustomWallpaper: (url: string | null) => void;
  setHighlightTarget: (id: string | null) => void;
  setRetroMode: (v: boolean) => void;
  setKernelPanic: (v: boolean) => void;
  setMeetingBooked: (v: boolean) => void;
  setMobileOpenOrigin: (appId: string, origin: string) => void;

  openWindow: (appId: AppId, title: string, payload?: WindowPayload, className?: string) => string;
  closeWindow: (id: string) => void;
  closeApp: (appId: AppId) => void;
  closeAllWindows: () => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  minimizeAllExcept: (appId: AppId) => void;
  restoreWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  isAppOpen: (appId: AppId) => boolean;
  getFocusedWindow: () => WindowState | undefined;
  executeCopilotActions: (actions: Array<{ type: string; appId?: AppId; payload?: WindowPayload; targetId?: string }>) => void;
}

export const useOSStore = create<OSStore>((set, get) => ({
  booted: false,
  bootSkipped: false,
  timeOfDay: 'afternoon',
  weather: null,
  wallpaper: '',
  customWallpaper: null,
  windows: [],
  recentApps: [],
  highlightTarget: null,
  retroMode: false,
  kernelPanic: false,
  meetingBooked: false,
  mobileOpenOrigins: {},

  setBooted: (v) => set({ booted: v }),
  setBootSkipped: (v) => set({ bootSkipped: v }),
  setTimeOfDay: (t) => set({ timeOfDay: t }),
  setWeather: (w) => set({ weather: w }),
  setWallpaper: (w) => set({ wallpaper: w }),
  setCustomWallpaper: (url) => {
    if (typeof window !== 'undefined') {
      if (url) localStorage.setItem('adityaos-custom-wallpaper', url);
      else localStorage.removeItem('adityaos-custom-wallpaper');
    }
    set({ customWallpaper: url });
  },
  setHighlightTarget: (id) => set({ highlightTarget: id }),
  setRetroMode: (v) => set({ retroMode: v }),
  setKernelPanic: (v) => set({ kernelPanic: v }),
  setMeetingBooked: (v) => set({ meetingBooked: v }),
  setMobileOpenOrigin: (appId, origin) =>
    set((s) => ({ mobileOpenOrigins: { ...s.mobileOpenOrigins, [appId]: origin } })),

  openWindow: (appId, title, payload, className) => {
    const state = get();
    // Check for any existing window (including minimized) so re-opening restores state.
    const existing = state.windows.find((w) => w.appId === appId);
    if (existing) {
      get().focusWindow(existing.id);
      if (payload) {
        set({
          windows: state.windows.map((w) =>
            w.id === existing.id ? { ...w, payload: { ...w.payload, ...payload }, minimized: false } : w
          ),
        });
      }
      return existing.id;
    }

    const id = `win-${appId}-${Date.now()}`;
    const index = state.windows.length;
    const newWindow: WindowState = {
      id,
      appId,
      title,
      position: defaultPosition(appId, index),
      size: defaultSize(appId),
      zIndex: nextZ(),
      minimized: false,
      focused: true,
      payload,
      className,
    };

    set({
      windows: [
        ...state.windows.map((w) => ({ ...w, focused: false })),
        newWindow,
      ],
      recentApps: [appId, ...state.recentApps.filter((a) => a !== appId)].slice(0, 8),
    });
    return id;
  },

  closeWindow: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
    })),

  closeApp: (appId) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.appId !== appId),
    })),

  closeAllWindows: () => set({ windows: [] }),

  focusWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, focused: true, zIndex: nextZ(), minimized: false }
          : { ...w, focused: false }
      ),
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true, focused: false } : w
      ),
    })),

  minimizeAllExcept: (appId) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.appId === appId ? w : { ...w, minimized: true, focused: false }
      ),
    })),

  restoreWindow: (id) => get().focusWindow(id),

  updateWindowPosition: (id, position) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position } : w)),
    })),

  updateWindowSize: (id, size) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    })),

  isAppOpen: (appId) => get().windows.some((w) => w.appId === appId && !w.minimized),

  getFocusedWindow: () => get().windows.find((w) => w.focused),

  executeCopilotActions: (actions) => {
    for (const action of actions) {
      if (action.type === 'openWindow' && action.appId) {
        const titles: Partial<Record<AppId, string>> = {
          terminal: 'AI Copilot',
          finder: 'Finder',
          'projects-lab': 'Projects Lab',
          'founder-hq': 'Founder HQ',
          'hackathon-museum': 'Hackathon Museum',
          'research-center': 'Research Center',
          github: 'GitHub Projects',
          resume: 'Resume',
          notes: 'Notes',
          videos: 'Project Videos',
          contributions: 'GitHub Activity',
          intro: 'Intro',
          photos: 'Photos',
          collaboration: 'Book Meeting',
        };
        get().openWindow(action.appId, titles[action.appId] ?? action.appId, action.payload);
      } else if (action.type === 'closeWindow') {
        if (action.appId) get().closeApp(action.appId);
        else get().closeAllWindows();
      } else if (action.type === 'highlight' && action.targetId) {
        get().setHighlightTarget(action.targetId);
        setTimeout(() => get().setHighlightTarget(null), 3000);
      }
    }
  },
}));

export function getActiveAppsMap(): Record<AppId, boolean> {
  const windows = useOSStore.getState().windows;
  const ids: AppId[] = [
    'intro', 'terminal', 'notes', 'github', 'resume', 'spotify', 'videos', 'contributions',
    'finder', 'projects-lab', 'founder-hq', 'hackathon-museum', 'research-center',
    'knowledge-base', 'build-mode', 'career-control', 'personal-dashboard', 'analytics', 'collaboration',
  ];
  return Object.fromEntries(ids.map((id) => [id, windows.some((w) => w.appId === id && !w.minimized)])) as Record<AppId, boolean>;
}
