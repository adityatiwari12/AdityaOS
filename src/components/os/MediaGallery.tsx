import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsChevronLeft, BsChevronRight, BsX, BsPlayCircle, BsImage } from 'react-icons/bs';
import type { HackathonPhoto } from '../../config/content/index';
import { useReducedMotion } from '../../lib/reducedMotion';

interface MediaGalleryProps {
  items: HackathonPhoto[];
  initialIndex?: number;
}

export default function MediaGallery({ items, initialIndex }: MediaGalleryProps) {
  const [active, setActive] = useState<number | null>(initialIndex ?? null);
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const reduced = useReducedMotion();
  const swipeStartX = useRef(0);
  const didSwipe = useRef(false);

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(() => setActive((i) => (i === null ? null : (i + 1) % items.length)), [items.length]);
  const prev = useCallback(() => setActive((i) => (i === null ? null : (i - 1 + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (active === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, close, next, prev]);

  const isVideo = (item: HackathonPhoto) => item.type === 'video';

  return (
    <>
      {/* Thumbnail grid — medium icon size (Windows Explorer style) */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
        {items.map((item, i) => (
          <motion.button
            key={item.src}
            onClick={() => setActive(i)}
            whileHover={reduced ? undefined : { scale: 1.04, y: -2 }}
            className="group relative rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-square focus:outline-none focus:ring-2 focus:ring-orange-400"
            title={item.caption}
          >
            {errored[i] ? (
              <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-500 px-2 text-center">
                <BsImage size={22} />
                <span className="text-[10px] leading-tight">{item.caption}</span>
              </div>
            ) : isVideo(item) ? (
              <>
                <video src={item.src} className="w-full h-full object-cover" muted preload="metadata" onError={() => setErrored((e) => ({ ...e, [i]: true }))} />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <BsPlayCircle size={30} className="text-white/90" />
                </span>
              </>
            ) : (
              <img
                src={item.src}
                alt={item.caption}
                loading="lazy"
                onError={() => setErrored((e) => ({ ...e, [i]: true }))}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <span className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[10px] text-white/90 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity truncate">
              {item.caption}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Slideshow lightbox */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={() => { if (!didSwipe.current) close(); didSwipe.current = false; }}
            onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; didSwipe.current = false; }}
            onTouchEnd={(e) => {
              const dx = swipeStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(dx) > 50) {
                didSwipe.current = true;
                e.preventDefault();
                if (dx > 0) next(); else prev();
              }
            }}
          >
            <button onClick={close} className="absolute top-5 right-5 text-white/80 hover:text-white p-2" aria-label="Close">
              <BsX size={32} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 md:left-8 text-white/70 hover:text-white p-2" aria-label="Previous">
              <BsChevronLeft size={32} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 md:right-8 text-white/70 hover:text-white p-2" aria-label="Next">
              <BsChevronRight size={32} />
            </button>

            <motion.div
              key={active}
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="max-w-[88vw] max-h-[82vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo(items[active]) ? (
                <video src={items[active].src} controls autoPlay className="max-w-[88vw] max-h-[74vh] rounded-lg" />
              ) : (
                <img src={items[active].src} alt={items[active].caption} className="max-w-[88vw] max-h-[74vh] rounded-lg object-contain" />
              )}
              <p className="text-white/90 text-sm mt-4 text-center">
                {items[active].caption}
                <span className="text-white/40 ml-3">{active + 1} / {items.length}</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
