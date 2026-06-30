import { useOSStore } from '../stores/osStore';
import type { AppId } from '../../os/types';

const EASTER_EGGS: Record<string, () => string | { message: string; action?: () => void }> = {
  'sudo hire aditya': () => ({
    message: 'Permission granted. Aditya is now hired. Email: tiwariaditya005@gmail.com',
    action: () => useOSStore.getState().openWindow('collaboration', 'Book Meeting'),
  }),
  whoami: () => 'aditya — AI & Software Engineer · Co-Founder @ Tokenistt',
  matrix: () => ({ message: 'Wake up, Neo…', action: () => useOSStore.getState().setRetroMode(true) }),
  coffee: () => '☕ Brewing… Tokenistt runs on coffee and LLM tokens.',
  '42': () => 'The answer to life, the universe, and everything. Also: 6× hackathon winner.',
};

let konamiIndex = 0;
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function handleEasterEgg(input: string): { handled: boolean; message?: string; action?: () => void } {
  const normalized = input.trim().toLowerCase();
  const egg = EASTER_EGGS[normalized];
  if (egg) {
    const result = egg();
    if (typeof result === 'string') return { handled: true, message: result };
    return { handled: true, message: result.message, action: result.action };
  }
  return { handled: false };
}

export function initKonamiCode(onTrigger: () => void) {
  const handler = (e: KeyboardEvent) => {
    if (e.key === KONAMI[konamiIndex]) {
      konamiIndex += 1;
      if (konamiIndex === KONAMI.length) {
        konamiIndex = 0;
        onTrigger();
      }
    } else {
      konamiIndex = 0;
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

export function triggerKernelPanic() {
  useOSStore.getState().setKernelPanic(true);
  setTimeout(() => useOSStore.getState().setKernelPanic(false), 4000);
}

export function openSecretWallpaper() {
  useOSStore.getState().setWallpaper('secret');
}
