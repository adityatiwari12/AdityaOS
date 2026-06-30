import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';
import type { AppId, WindowPayload } from '../../os/types';

interface NotifDef {
  id: string;
  appName: string;
  body: string;
  targetApp: AppId;
  targetTitle: string;
  payload?: WindowPayload;
  // If set, shows a thumbnail preview image inside the notification
  previewImg?: string;
}

// hackathonGallery index reference (Photos.tsx / content/index.ts):
// 0=sih-video  1=thinktank-win  2=sih-pitch  3=sih-picture  4=ministry-hackathon-win
// 5=ministry-pitch-grant  6=ministry-cheque  7=bgi-hackathon-win  8=innovik-hackathon-win
// 9=chandigarh-hackathon  10=ai-fusion-win  11=mediverse-win  12=kriyeta-win
const QUEUE: NotifDef[] = [
  {
    id: 'thinktank',
    appName: 'AI Copilot',
    body: 'IEEE Think Tank 2026 — National Winner 🏆',
    targetApp: 'photos',
    targetTitle: 'Photos',
    payload: { photoIndex: 1 },
    previewImg: '/images/gallery/thinktank-win.jpeg',
  },
  {
    id: 'founder',
    appName: 'AI Copilot',
    body: "He's building something big. See Tokenistt 🚀",
    targetApp: 'founder-hq',
    targetTitle: 'Founder HQ',
  },
  {
    id: 'ministry-win',
    appName: 'AI Copilot',
    body: 'Won grant from Ministry of Tribal Affairs 🇮🇳',
    targetApp: 'photos',
    targetTitle: 'Photos',
    payload: { photoIndex: 4 },
    previewImg: '/images/gallery/ministry-hackathon-win.jpeg',
  },
  {
    id: 'book-call',
    appName: 'AI Copilot',
    body: 'Got 30 minutes? Book a call with Aditya 📅',
    targetApp: 'collaboration',
    targetTitle: 'Book a Meeting',
  },
  {
    id: 'ai-fusion',
    appName: 'AI Copilot',
    body: 'AI Fusion 2026 — 1st Place Winner 🥇',
    targetApp: 'photos',
    targetTitle: 'Photos',
    payload: { photoIndex: 10 },
    previewImg: '/images/gallery/ai-fusion-win.jpeg',
  },
  {
    id: 'projects',
    appName: 'AI Copilot',
    body: 'Check out his latest projects on GitHub 👾',
    targetApp: 'github',
    targetTitle: 'Projects',
  },
  {
    id: 'mediverse',
    appName: 'AI Copilot',
    body: 'MEDI<VERSE> Hackathon — 1st Place Winner 🏥',
    targetApp: 'photos',
    targetTitle: 'Photos',
    payload: { photoIndex: 11 },
    previewImg: '/images/gallery/mediverse-win.jpeg',
  },
  {
    id: 'research',
    appName: 'AI Copilot',
    body: 'He has peer-reviewed publications. Read more 📖',
    targetApp: 'research-center',
    targetTitle: 'Research Center',
  },
  {
    id: 'kriyeta',
    appName: 'AI Copilot',
    body: 'Kriyeta 5.0 — National Hackathon Winner 🎯',
    targetApp: 'photos',
    targetTitle: 'Photos',
    payload: { photoIndex: 12 },
    previewImg: '/images/gallery/kriyeta-win.jpg',
  },
  {
    id: 'mythos',
    appName: 'AI Copilot',
    body: 'SDE Intern at Mythos, Singapore 🌏',
    targetApp: 'notes',
    targetTitle: 'Notes',
    payload: { section: 'experience' },
  },
  {
    id: 'ministry-pitch',
    appName: 'AI Copilot',
    body: 'Pitching to Education Minister of India 🎤',
    targetApp: 'photos',
    targetTitle: 'Photos',
    payload: { photoIndex: 18 },
    previewImg: '/images/gallery/pitching-education-minister.jpeg',
  },
  {
    id: 'copilot',
    appName: 'AI Copilot',
    body: 'Ask me anything about Aditya 🤖',
    targetApp: 'terminal',
    targetTitle: 'AI Copilot',
  },
];

const SHOW_MS = 9_000;
const INTERVAL_MS = 30_000;

export default function MobileNotification() {
  const openWindow = useOSStore((s) => s.openWindow);
  const minimizeAllExcept = useOSStore((s) => s.minimizeAllExcept);
  const gameOpen = useOSStore((s) => s.isAppOpen('hackathon-rush'));
  const [current, setCurrent] = useState<NotifDef | null>(null);
  const idxRef = useRef(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const show = () => {
    if (useOSStore.getState().isAppOpen('hackathon-rush')) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    const notif = QUEUE[idxRef.current % QUEUE.length];
    idxRef.current += 1;
    setCurrent(notif);
    dismissTimer.current = setTimeout(() => setCurrent(null), SHOW_MS);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;

    if (gameOpen) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setCurrent(null);
      return;
    }

    const first = setTimeout(() => {
      show();
      intervalRef.current = setInterval(show, INTERVAL_MS);
    }, INTERVAL_MS);

    return () => {
      clearTimeout(first);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [gameOpen]);

  const handleTap = (notif: NotifDef) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setCurrent(null);
    setTimeout(() => {
      minimizeAllExcept(notif.targetApp);
      openWindow(notif.targetApp, notif.targetTitle, notif.payload);
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
          <div
            className="relative overflow-hidden rounded-[22px]"
            style={{
              background: 'rgba(44,44,50,0.82)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.14)',
            }}
          >
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
              {/* Left: profile photo or gallery preview */}
              {current.previewImg ? (
                <img
                  src={current.previewImg}
                  alt=""
                  className="w-[42px] h-[42px] rounded-[11px] object-cover shrink-0"
                />
              ) : (
                <img
                  src="/images/profile/aditya.png"
                  alt="AI Copilot"
                  className="w-[42px] h-[42px] rounded-[11px] object-cover object-top shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-white/45 uppercase tracking-wider">
                    {current.appName}
                  </span>
                  <span className="text-[11px] text-white/30 shrink-0 ml-2">now</span>
                </div>
                <p className="text-[14.5px] font-medium text-white leading-[1.35] line-clamp-2">
                  {current.body}
                </p>
              </div>

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

            <div
              className="flex items-center justify-between px-4 pb-3 pt-0"
              style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-[11.5px] text-white/35">Tap to open</span>
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
