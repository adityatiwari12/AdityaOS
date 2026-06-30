import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';
import { springGentle } from '../../lib/motion';

const BOOT_STEPS = [
  { label: 'Initializing kernel…', pct: 20 },
  { label: 'Loading AdityaOS…', pct: 45 },
  { label: 'Mounting filesystem…', pct: 70 },
  { label: 'Starting desktop…', pct: 90 },
  { label: 'Welcome', pct: 100 },
];

export default function BootSequence() {
  const booted = useOSStore((s) => s.booted);
  const setBooted = useOSStore((s) => s.setBooted);
  const setBootSkipped = useOSStore((s) => s.setBootSkipped);
  const [step, setStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  // Prevents SSR HTML from briefly rendering on client before hydration check
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // On mobile the lock screen replaces the boot sequence — skip immediately.
    if (window.innerWidth < 768) {
      setBooted(true);
      return;
    }

    // Desktop: 5 steps × 800ms + 1000ms welcome = ~5s total.
    const STEP_MS = 800;
    const WELCOME_MS = 1000;

    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i), i * STEP_MS));
    });
    timers.push(setTimeout(() => setShowWelcome(true), BOOT_STEPS.length * STEP_MS));
    timers.push(setTimeout(() => {
      setBooted(true);
    }, BOOT_STEPS.length * STEP_MS + WELCOME_MS));

    return () => timers.forEach(clearTimeout);
  }, [setBooted, setBootSkipped]);

  const skip = () => {
    setBootSkipped(true);
    setBooted(true);
  };

  // Not mounted yet (SSR) or already booted or mobile → render nothing
  if (!mounted || booted || window.innerWidth < 768) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springGentle}
          className="mb-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-2xl border border-white/10">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
        </motion.div>

        {!showWelcome ? (
          <>
            <p className="text-gray-400 text-sm mb-4">{BOOT_STEPS[step]?.label}</p>
            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ width: `${BOOT_STEPS[step]?.pct ?? 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-2xl font-semibold text-white">Welcome to AdityaOS</h1>
            <p className="text-gray-500 text-sm mt-2">This isn&apos;t a portfolio. It&apos;s my operating system.</p>
          </motion.div>
        )}

        <button onClick={skip} className="absolute bottom-8 text-gray-500 text-sm hover:text-white transition-colors">
          Skip Boot
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
