import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';
import type { AppId } from '../../os/types';

interface NotifDef {
  id: string;
  appName: string;
  body: string;
  targetApp: AppId;
  targetTitle: string;
}

// Cycles every 15s, loops back to start
const QUEUE: NotifDef[] = [
  {
    id: 'hackathon-wins',
    appName: 'AI Copilot',
    body: 'Want me to show his hackathon wins? 🏆',
    targetApp: 'photos',
    targetTitle: 'Photos',
  },
  {
    id: 'founder',
    appName: 'AI Copilot',
    body: "He's building something big. See Founder HQ 🚀",
    targetApp: 'founder-hq',
    targetTitle: 'Founder HQ',
  },
  {
    id: 'book-call',
    appName: 'AI Copilot',
    body: 'Got 30 minutes? Book a call with Aditya 📅',
    targetApp: 'collaboration',
    targetTitle: 'Book a Meeting',
  },
  {
    id: 'projects',
    appName: 'AI Copilot',
    body: 'Check out his latest projects on GitHub 👾',
    targetApp: 'github',
    targetTitle: 'Projects',
  },
  {
    id: 'research',
    appName: 'AI Copilot',
    body: 'He has peer-reviewed publications. Read more 📖',
    targetApp: 'research-center',
    targetTitle: 'Research Center',
  },
];

const SHOW_MS = 9_000;   // how long notification stays visible
const INTERVAL_MS = 15_000; // fire every 15s

export default function MobileNotification() {
  const openWindow = useOSStore((s) => s.openWindow);
  const minimizeAllExcept = useOSStore((s) => s.minimizeAllExcept);
  const [current, setCurrent] = useState<NotifDef | null>(null);
  const idxRef = useRef(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const show = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    const notif = QUEUE[idxRef.current % QUEUE.length];
    idxRef.current += 1;
    setCurrent(notif);
    dismissTimer.current = setTimeout(() => setCurrent(null), SHOW_MS);
  };

  useEffect(() => {
    if (window.innerWidth >= 768) return;

    // First notification after 15s, then every 15s
    const first = setTimeout(() => {
      show();
      intervalRef.current = setInterval(show, INTERVAL_MS);
    }, INTERVAL_MS);

    return () => {
      clearTimeout(first);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = (notif: NotifDef) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setCurrent(null);
    setTimeout(() => {
      minimizeAllExcept(notif.targetApp);
      openWindow(notif.targetApp, notif.targetTitle);
    }, 250);
  };

  const dismiss = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setCurrent(null);
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="fixed left-3 right-3 z-[500] md:hidden cursor-pointer select-none"
          style={{ top: 'calc(56px + 6px)' }}
          initial={{ y: -110, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -110, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 460, damping: 38, mass: 0.75 }}
          onClick={() => handleTap(current)}
        >
          {/* iOS notification card */}
          <div
            className="relative overflow-hidden rounded-[22px]"
            style={{
              background: 'rgba(44,44,50,0.82)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.14)',
            }}
          >
            {/* Main row */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
              {/* App icon — profile photo */}
              <img
                src="/images/profile/aditya.png"
                alt="AI Copilot"
                className="w-[42px] h-[42px] rounded-[11px] object-cover object-top shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* App name + time */}
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-white/45 uppercase tracking-wider">
                    {current.appName}
                  </span>
                  <span className="text-[11px] text-white/30 shrink-0 ml-2">now</span>
                </div>
                {/* Message — allow up to 2 lines */}
                <p className="text-[14.5px] font-medium text-white leading-[1.35] line-clamp-2">
                  {current.body}
                </p>
              </div>

              {/* Dismiss */}
              <button
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center ml-1"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                onClick={dismiss}
                aria-label="Dismiss"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Tap hint row */}
            <div
              className="flex items-center justify-between px-4 pb-3 pt-0"
              style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-[11.5px] text-white/35">Tap to open</span>
              {/* Countdown bar */}
              <div className="flex-1 mx-3 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'rgba(255,255,255,0.35)' }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: SHOW_MS / 1000, ease: 'linear' }}
                />
              </div>
              <span className="text-[11.5px] text-white/35">{SHOW_MS / 1000}s</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
