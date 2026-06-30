import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';

interface Props {
  onChangeWallpaper: () => void;
}

const LONG_PRESS_MS = 550;

// Items that should block the long-press (interactive UI)
const BLOCK_SELECTORS = ['[role="dialog"]', 'nav', 'header', 'button', 'a', 'input', 'textarea'];

export default function WallpaperContextMenu({ onChangeWallpaper }: Props) {
  const retroMode = useOSStore((s) => s.retroMode);
  const setRetroMode = useOSStore((s) => s.setRetroMode);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const [showAbout, setShowAbout] = useState(false);
  const [showSysInfo, setShowSysInfo] = useState(false);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const isBlocked = (target: EventTarget | null) => {
    if (!target) return false;
    return BLOCK_SELECTORS.some((s) => (target as HTMLElement).closest(s));
  };

  // ── Touch (mobile) ──────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: TouchEvent) => {
    if (isBlocked(e.target)) return;
    const t = e.touches[0];
    originRef.current = { x: t.clientX, y: t.clientY };
    timerRef.current = setTimeout(() => {
      setPos({ x: t.clientX, y: t.clientY });
      setOpen(true);
    }, LONG_PRESS_MS);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - originRef.current.x);
    const dy = Math.abs(t.clientY - originRef.current.y);
    if (dx > 8 || dy > 8) cancel();
  }, [cancel]);

  // ── Right-click (desktop) ────────────────────────────────────────────────
  const onContextMenu = useCallback((e: MouseEvent) => {
    if (isBlocked(e.target)) return;
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
    setOpen(true);
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', cancel);
    document.addEventListener('touchcancel', cancel);
    document.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', cancel);
      document.removeEventListener('touchcancel', cancel);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [onTouchStart, onTouchMove, cancel, onContextMenu]);

  const close = () => setOpen(false);

  // Clamp menu to viewport
  const menuW = 260;
  const menuH = 210;
  const clampedX = Math.min(pos.x, window.innerWidth - menuW - 12);
  const clampedY = Math.min(pos.y, window.innerHeight - menuH - 12);

  const uptime = (() => {
    const s = Math.floor(performance.now() / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  })();

  const items = [
    {
      label: 'Change Wallpaper',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 11l4-4 3 3 2-2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ),
      action: () => { close(); onChangeWallpaper(); },
    },
    {
      label: retroMode ? 'Exit Developer Mode' : 'Developer Mode',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="4,5 1,8 4,11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><polyline points="12,5 15,8 12,11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="2" x2="7" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      ),
      action: () => { close(); setRetroMode(!retroMode); },
    },
    {
      label: 'About AdityaOS',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><line x1="8" y1="7" x2="8" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="8" cy="5" r="0.8" fill="currentColor"/></svg>
      ),
      action: () => { close(); setShowAbout(true); },
    },
    {
      label: 'System Info',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><line x1="5" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="8" y1="12" x2="8" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      ),
      action: () => { close(); setShowSysInfo(true); },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[490]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Context menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed z-[491] select-none"
            style={{ left: clampedX, top: clampedY, width: menuW }}
            initial={{ opacity: 0, scale: 0.88, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -8 }}
            transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.6 }}
          >
            <div
              className="rounded-[16px] overflow-hidden"
              style={{
                background: 'rgba(40,40,46,0.86)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.55), inset 0 0.5px 0 rgba(255,255,255,0.12)',
              }}
            >
              {items.map((item, i) => (
                <div key={item.label}>
                  <button
                    onClick={item.action}
                    className="w-full flex items-center justify-between px-4 py-[13px] text-white text-[15px] text-left active:bg-white/10 transition-colors"
                  >
                    <span className="font-normal">{item.label}</span>
                    <span className="text-white/40 ml-3 shrink-0">{item.icon}</span>
                  </button>
                  {i < items.length - 1 && (
                    <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About AdityaOS modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            className="fixed inset-0 z-[492] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAbout(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-[22px] p-6 text-white text-center"
              style={{
                background: 'rgba(30,30,36,0.92)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 0.5px 0 rgba(255,255,255,0.12)',
              }}
              initial={{ scale: 0.88, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/10">
                <span className="text-2xl font-bold">A</span>
              </div>
              <h2 className="text-xl font-semibold mb-1">AdityaOS</h2>
              <p className="text-white/45 text-sm mb-4">Version 2.0 · Built with Astro + React</p>
              <div className="text-sm text-white/60 space-y-1 text-left bg-white/5 rounded-xl p-3">
                <p>Kernel · <span className="text-white/80">AdityaOS v2.0</span></p>
                <p>Runtime · <span className="text-white/80">React 19 + Framer Motion</span></p>
                <p>Backend · <span className="text-white/80">Neon Postgres + Groq LLM</span></p>
                <p>Deploy · <span className="text-white/80">Vercel Edge</span></p>
                <p>Author · <span className="text-white/80">Aditya Tiwari</span></p>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Info modal */}
      <AnimatePresence>
        {showSysInfo && (
          <motion.div
            className="fixed inset-0 z-[492] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSysInfo(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-[22px] p-6 text-white"
              style={{
                background: 'rgba(30,30,36,0.92)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 0.5px 0 rgba(255,255,255,0.12)',
              }}
              initial={{ scale: 0.88, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4 text-center">System Info</h2>
              <div className="space-y-2 text-sm">
                {[
                  ['Uptime', uptime],
                  ['Platform', navigator.platform || 'Unknown'],
                  ['User Agent', navigator.userAgent.split(' ').slice(-2).join(' ')],
                  ['Screen', `${window.screen.width}×${window.screen.height}`],
                  ['Viewport', `${window.innerWidth}×${window.innerHeight}`],
                  ['DPR', String(window.devicePixelRatio)],
                  ['Memory', (navigator as { deviceMemory?: number }).deviceMemory ? `${(navigator as { deviceMemory?: number }).deviceMemory} GB` : 'N/A'],
                  ['Build', new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                    <span className="text-white/45">{k}</span>
                    <span className="text-white/80 text-right max-w-[55%] truncate">{v}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSysInfo(false)}
                className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
