import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';
import { useTourStore } from '../../stores/tourStore';

const SESSION_KEY = 'adityaos-tour-seen';

export default function TourNotification() {
  const booted = useOSStore((s) => s.booted);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!booted) return;
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const t = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(true);
    }, 10_000);

    return () => clearTimeout(t);
  }, [booted]);

  // Auto-dismiss after 15s if user ignores it
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 15_000);
    return () => clearTimeout(t);
  }, [visible]);

  const dismiss = () => setVisible(false);

  const handleStart = () => {
    dismiss();
    useTourStore.getState().startTour();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed top-14 right-4 z-[9990] w-80 rounded-2xl border border-white/15 shadow-2xl backdrop-blur-xl bg-black/65 p-4 select-none"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="relative shrink-0">
              <img
                src="/images/profile/aditya.png"
                alt="Aditya AI"
                className="w-10 h-10 rounded-full object-cover object-top ring-1 ring-white/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 text-[13px]">🤖</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Aditya AI</p>
              <p className="text-[10px] text-white/45">AdityaOS · now</p>
            </div>
            <button
              onClick={dismiss}
              className="ml-auto text-white/35 hover:text-white/70 transition-colors text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <p className="text-sm text-white/85 leading-relaxed mb-3">
            You look like you're here to evaluate my work.{' '}
            <span className="text-white font-medium">Want the 90-second guided tour?</span>
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-xs font-semibold"
            >
              Start Tour
            </button>
            <button
              onClick={dismiss}
              className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/80 text-xs font-medium"
            >
              I'll Explore Myself
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
