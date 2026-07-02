import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useDragControls } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';
import { springWindow } from '../../lib/motion';
import { useReducedMotion } from '../../lib/reducedMotion';
import TrafficLights from './TrafficLights';
import type { WindowState } from '../../os/types';

const MIN_W = 400;
const MIN_H = 300;

interface OSWindowProps {
  windowState: WindowState;
  title: string;
  children: React.ReactNode;
}

export default function OSWindow({ windowState, title, children }: OSWindowProps) {
  const { id, position, size, zIndex, minimized, focused } = windowState;
  const closeWindow = useOSStore((s) => s.closeWindow);
  const focusWindow = useOSStore((s) => s.focusWindow);
  const minimizeWindow = useOSStore((s) => s.minimizeWindow);
  const updatePosition = useOSStore((s) => s.updateWindowPosition);
  const updateSize = useOSStore((s) => s.updateWindowSize);
  const mobileOrigin = useOSStore((s) => s.mobileOpenOrigins[windowState.appId] ?? '50% 100%');
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const prevGeom = useRef<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);
  const swipeStartY = useRef(0);
  const [zoomed, setZoomed] = useState(!!windowState.openFullscreen);
  const [isMobile, setIsMobile] = useState(false);
  // Mobile-only visibility states so we can play exit animation before unmounting.
  const [mobileVisible, setMobileVisible] = useState(!minimized);
  const [mobileExiting, setMobileExiting] = useState(false);

  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Mobile: watch minimized changes to play enter/exit animations.
  useEffect(() => {
    if (!isMobile) return;
    if (minimized && !mobileExiting) {
      setMobileExiting(true);
      const t = setTimeout(() => { setMobileExiting(false); setMobileVisible(false); }, 280);
      return () => clearTimeout(t);
    }
    if (!minimized) {
      setMobileExiting(false);
      setMobileVisible(true);
    }
  }, [minimized, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    x.set(position.x);
    y.set(position.y);
  }, [position.x, position.y, x, y]);

  const TOP_INSET = 36; // clears the fixed menu bar
  const BOTTOM_INSET = 96; // leaves room for the dock

  const toggleZoom = () => {
    if (zoomed && prevGeom.current) {
      updatePosition(id, prevGeom.current.position);
      updateSize(id, prevGeom.current.size);
      setZoomed(false);
    } else {
      prevGeom.current = { position, size };
      // Start just below the menu bar so the traffic lights stay visible, but
      // fill the rest of the screen (full width, all the way to the bottom).
      updatePosition(id, { x: 0, y: TOP_INSET });
      updateSize(id, { width: window.innerWidth, height: window.innerHeight - TOP_INSET });
      setZoomed(true);
    }
    focusWindow(id);
  };

  const tile = (side: 'left' | 'right') => {
    if (!zoomed) prevGeom.current = { position, size };
    const halfW = Math.floor(window.innerWidth / 2);
    const h = window.innerHeight - TOP_INSET - BOTTOM_INSET;
    updatePosition(id, { x: side === 'left' ? 0 : halfW, y: TOP_INSET });
    updateSize(id, { width: halfW, height: h });
    setZoomed(true);
    focusWindow(id);
  };

  // Desktop: simple early-out. Mobile: let the exit animation play first.
  if (!isMobile && minimized) return null;
  if (isMobile && !mobileVisible && !mobileExiting) return null;

  const header = (
    <div
      className="window-header apple-titlebar h-[44px] md:h-[38px] flex items-center gap-2 px-3.5 cursor-grab active:cursor-grabbing"
      onPointerDown={isMobile ? undefined : (e) => dragControls.start(e)}
      onDoubleClick={isMobile ? undefined : toggleZoom}
      onTouchStart={isMobile ? (e) => { swipeStartY.current = e.touches[0].clientY; } : undefined}
      onTouchEnd={isMobile ? (e) => {
        const dy = e.changedTouches[0].clientY - swipeStartY.current;
        if (dy > 80) minimizeWindow(id);
      } : undefined}
    >
      <TrafficLights
        onClose={() => closeWindow(id)}
        onMinimize={() => minimizeWindow(id)}
        onZoom={toggleZoom}
        onTileLeft={isMobile ? undefined : () => tile('left')}
        onTileRight={isMobile ? undefined : () => tile('right')}
        zoomed={zoomed}
      />
      <span id={`title-${id}`} className={`flex-1 text-center text-[13px] font-medium truncate ${focused ? 'text-white/85' : 'text-white/45'}`}>
        {title}
      </span>
      <span className="w-[63px]" aria-hidden="true" />
    </div>
  );

  // Mobile: true fullscreen — covers entire viewport below the system menubar.
  if (isMobile) {
    return (
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`title-${id}`}
        tabIndex={0}
        onTouchStart={() => focusWindow(id)}
        className="fixed inset-x-0 top-14 bottom-0 bg-[var(--window-bg)] overflow-hidden"
        style={{ zIndex: 280 + zIndex, transformOrigin: reduced ? undefined : mobileOrigin }}
        initial={reduced ? false : { opacity: 0, scale: 0.08 }}
        animate={reduced ? {} : mobileExiting ? { opacity: 0, scale: 0.08 } : { opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0 } : mobileExiting
          ? { duration: 0.22, ease: [0.32, 0, 0.67, 0] }
          : { type: 'spring', stiffness: 420, damping: 36, mass: 0.85 }
        }
      >
        {/* Minimal top bar: title + traffic lights only */}
        <div
          className="flex items-center justify-between px-4 h-11 shrink-0 border-b border-white/[0.07]"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)' }}
          onTouchStart={(e) => { swipeStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            if (e.changedTouches[0].clientY - swipeStartY.current > 80) minimizeWindow(id);
          }}
        >
          <TrafficLights
            onClose={() => closeWindow(id)}
            onMinimize={() => minimizeWindow(id)}
            onZoom={() => {}}
          />
          <span id={`title-${id}`} className="absolute left-1/2 -translate-x-1/2 text-[13px] font-medium text-white/80 truncate max-w-[55vw]">
            {title}
          </span>
          <span className="w-[54px]" aria-hidden="true" />
        </div>

        {/* Full-height content */}
        <div
          className="overflow-y-auto no-scrollbar"
          style={{ height: 'calc(100% - 44px)' }}
        >
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`title-${id}`}
      tabIndex={0}
      drag
      dragControls={dragControls}
      dragMomentum={!reduced}
      dragElastic={0}
      dragListener={false}
      onDragEnd={(_, info) => {
        const nx = position.x + info.offset.x;
        const ny = Math.max(24, position.y + info.offset.y);
        updatePosition(id, { x: nx, y: ny });
      }}
      onMouseDown={() => focusWindow(id)}
      className={`absolute rounded-[11px] glass-strong shadow-window overflow-hidden ${
        focused ? 'ring-[0.5px] ring-white/15' : 'ring-[0.5px] ring-black/30'
      }`}
      style={{
        x,
        y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      initial={reduced ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : springWindow}
    >
      {header}
      <div className="h-[calc(100%-38px)] overflow-hidden bg-[var(--window-bg)]">
        {children}
      </div>
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = size.width;
          const startH = size.height;
          const onMove = (ev: MouseEvent) => {
            updateSize(id, {
              width: Math.max(MIN_W, startW + ev.clientX - startX),
              height: Math.max(MIN_H, startH + ev.clientY - startY),
            });
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      />
    </motion.div>
  );
}
