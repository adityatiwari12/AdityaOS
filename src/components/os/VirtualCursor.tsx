import { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export interface CursorHandle {
  moveTo: (x: number, y: number, durationMs?: number) => Promise<void>;
  click: (x: number, y: number) => Promise<void>;
  hoverCenter: (selector: string, durationMs?: number) => Promise<void>;
}

const VirtualCursor = forwardRef<CursorHandle>((_, ref) => {
  const rawX = useMotionValue(window.innerWidth / 2);
  const rawY = useMotionValue(window.innerHeight / 2);
  const x = useSpring(rawX, { stiffness: 180, damping: 28 });
  const y = useSpring(rawY, { stiffness: 180, damping: 28 });
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    moveTo(tx: number, ty: number, durationMs = 700): Promise<void> {
      return new Promise((res) => {
        rawX.set(tx);
        rawY.set(ty);
        // resolve after spring settles (approximate by duration)
        const t = setTimeout(() => {
          resolveRef.current = null;
          res();
        }, durationMs + 100);
        resolveRef.current = () => { clearTimeout(t); res(); };
      });
    },

    async click(tx: number, ty: number): Promise<void> {
      await this.moveTo(tx, ty, 500);
      setRipple({ x: tx, y: ty });
      const el = document.elementFromPoint(tx, ty) as HTMLElement | null;
      if (el) {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: tx, clientY: ty }));
      }
      await new Promise<void>((res) => setTimeout(res, 220));
      setRipple(null);
      await new Promise<void>((res) => setTimeout(res, 80));
    },

    async hoverCenter(selector: string, durationMs = 2000): Promise<void> {
      const el = selector.startsWith('[data-tour-id=')
        ? document.querySelector(selector)
        : document.querySelector(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      await this.moveTo(r.left + r.width / 2, r.top + r.height / 2, 600);
      await new Promise<void>((res) => setTimeout(res, durationMs));
    },
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true">
      <motion.div style={{ x, y, position: 'absolute', top: 0, left: 0 }}>
        {/* macOS-style arrow cursor */}
        <svg width="24" height="28" viewBox="0 0 24 28" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          <path d="M4 2L4 22L9 16.5L13 25L16 23.5L12 15L20 15L4 2Z" fill="white" stroke="#333" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </motion.div>

      {ripple && (
        <motion.div
          key={`${ripple.x}-${ripple.y}`}
          style={{ position: 'absolute', left: ripple.x - 16, top: ripple.y - 16, width: 32, height: 32 }}
          initial={{ opacity: 0.8, scale: 0.4 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="rounded-full border-2 border-white/70"
        />
      )}
    </div>
  );
});

VirtualCursor.displayName = 'VirtualCursor';
export default VirtualCursor;
