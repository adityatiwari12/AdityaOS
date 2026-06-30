import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { userConfig } from '../../config/index';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [time, setTime] = useState(new Date());
  const touchStartY = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const onKey = (e: KeyboardEvent) => { if (e.key !== 'Tab') onUnlock(); };
    document.addEventListener('keydown', onKey);
    return () => { clearInterval(t); document.removeEventListener('keydown', onKey); };
  }, [onUnlock]);

  const hh = time.getHours() % 12 || 12;
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
  const timeStr = `${hh}:${mm}`;
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      className="fixed inset-0 z-[600] flex flex-col select-none text-white"
      style={{ backdropFilter: 'blur(40px) saturate(160%)', background: 'rgba(0,0,0,0.45)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onUnlock}
      onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
      onTouchEnd={(e) => {
        const dy = touchStartY.current - e.changedTouches[0].clientY;
        if (dy >= 30 || Math.abs(dy) < 10) onUnlock();
      }}
    >

      {/* ── Mobile lock screen ── */}
      <div className="md:hidden flex flex-col flex-1 items-center px-6 pt-14 pb-4 gap-0">

        {/* Time */}
        <div className="flex items-end gap-2 leading-none mb-1">
          <span className="text-[80px] font-extralight tabular-nums tracking-tight">{timeStr}</span>
          <span className="text-2xl font-light text-white/50 mb-3">{ampm}</span>
        </div>
        <p className="text-base text-white/55 font-light mb-8">{dateStr}</p>

        {/* Profile card */}
        <div
          className="w-full rounded-3xl px-5 py-5 flex flex-col items-center gap-3 text-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(20px)' }}
        >
          <img
            src="/images/profile/aditya.png"
            alt={userConfig.name}
            className="w-20 h-20 rounded-full object-cover object-top ring-2 ring-white/25"
          />
          <div>
            <p className="text-[13px] text-white/50 font-light">Hello 👋 I'm</p>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">{userConfig.name}</h1>
            <p className="text-[13px] text-white/60 mt-1">{userConfig.role}</p>
          </div>
          <p className="text-[12px] text-white/45 leading-relaxed max-w-xs">
            Engineering undergrad · 7× hackathon winner · building AI systems at{' '}
            <span className="text-orange-300/80">Tokenistt</span> &{' '}
            <span className="text-blue-300/80">Mythos</span>
          </p>
        </div>

        <div className="flex-1" />
      </div>

      {/* ── Mobile swipe hint ── */}
      <div className="md:hidden flex flex-col items-center pb-10 gap-2.5">
        <motion.div
          className="w-10 h-10 rounded-full border border-white/25 flex items-center justify-center"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
        <p className="text-[11px] text-white/35 tracking-widest uppercase">Swipe up to open</p>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden md:flex flex-col flex-1 items-center justify-center gap-4 text-center">
        <img
          src="/images/profile/aditya.png"
          alt={userConfig.name}
          className="w-24 h-24 rounded-full object-cover object-top ring-2 ring-white/25"
        />
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="text-7xl font-thin tabular-nums">{timeStr} <span className="text-3xl text-white/40">{ampm}</span></p>
          <p className="text-xl text-white/60">{dateStr}</p>
        </div>
        <p className="text-sm text-white/30 mt-4 tracking-widest uppercase">Click anywhere or press any key</p>
      </div>

    </motion.div>
  );
}
