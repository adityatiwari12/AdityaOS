import { create } from 'zustand';

interface TourStore {
  running: boolean;
  step: number;
  totalSteps: number;
  muted: boolean;
  captionTitle: string;
  captionBody: string;
  showFinal: boolean;
  startTour: () => void;
  skipTour: () => void;
  toggleMute: () => void;
  _advance: (step: number, title: string, body: string) => void;
  _finish: () => void;
}

export const useTourStore = create<TourStore>()((set) => ({
  running: false,
  step: 0,
  totalSteps: 9,
  muted: false,
  captionTitle: '',
  captionBody: '',
  showFinal: false,

  startTour: () =>
    set({ running: true, step: 0, showFinal: false, captionTitle: '', captionBody: '' }),

  skipTour: () =>
    set({ running: false, showFinal: false, captionTitle: '', captionBody: '', step: 0 }),

  toggleMute: () => set((s) => ({ muted: !s.muted })),

  _advance: (step, title, body) =>
    set({ step, captionTitle: title, captionBody: body }),

  _finish: () =>
    set({ running: false, showFinal: true, captionTitle: '', captionBody: '' }),
}));
