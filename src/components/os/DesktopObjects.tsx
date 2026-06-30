import { motion } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';
import { useReducedMotion } from '../../lib/reducedMotion';

/** Apple Photos–style rainbow pinwheel logo. */
function PhotosLogo({ size = 34 }: { size?: number }) {
  const colors = ['#FCC500', '#92C83E', '#19B6A8', '#1FA7F0', '#4C56C0', '#8E40B5', '#E54C8C', '#F26B3A'];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" aria-hidden="true">
      <g style={{ mixBlendMode: 'screen' }}>
        {colors.map((c, i) => (
          <ellipse
            key={c}
            cx="50"
            cy="30"
            rx="12"
            ry="22"
            fill={c}
            opacity="0.9"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="11" fill="#fff" />
    </svg>
  );
}

interface DesktopObjectProps {
  emoji?: string;
  icon?: React.ReactNode;
  label: string;
  hint: string;
  index: number;
  reduced: boolean;
  onActivate: () => void;
  doubleClick?: boolean;
}

function DesktopObject({ emoji, icon, label, hint, index, reduced, onActivate, doubleClick }: DesktopObjectProps) {
  return (
    <motion.button
      className="flex flex-col items-center gap-2 pointer-events-auto group"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, y: [0, -6, 0] }
      }
      transition={
        reduced
          ? undefined
          : { y: { duration: 4 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }, opacity: { duration: 0.6, delay: 0.4 + index * 0.1 } }
      }
      whileHover={{ scale: 1.08, y: -6 }}
      whileTap={{ scale: 0.94 }}
      onClick={doubleClick ? undefined : onActivate}
      onDoubleClick={doubleClick ? onActivate : undefined}
      title={hint}
      aria-label={hint}
    >
      <span className="relative flex items-center justify-center w-16 h-16 rounded-2xl glass border border-white/15 shadow-soft transition-all duration-300 group-hover:border-white/30 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        <span className="absolute inset-x-2 top-1 h-1/3 rounded-full bg-white/15 blur-[6px]" />
        {icon ? (
          <span className="relative flex items-center justify-center select-none">{icon}</span>
        ) : (
          <span className="text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] select-none">{emoji}</span>
        )}
      </span>
      <span className="text-[11px] font-medium text-white/85 px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-sm opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </motion.button>
  );
}

export default function DesktopObjects() {
  const booted = useOSStore((s) => s.booted);
  const openWindow = useOSStore((s) => s.openWindow);
  const reduced = useReducedMotion();

  if (!booted) return null;

  return (
    <div className="hidden xl:flex flex-col items-center gap-5 fixed top-20 right-6 z-[4] pointer-events-none" aria-label="Desktop">
      {/* Right-aligned vertical icon column, macOS desktop style */}
      <DesktopObject
        emoji="📚" label="Research" hint="Open Research Papers" index={0} reduced={reduced}
        onActivate={() => openWindow('research-center', 'Research Center')}
      />
      <DesktopObject
        emoji="🏆" label="Trophies" hint="Open hackathon wins & awards" index={1} reduced={reduced}
        onActivate={() => openWindow('notes', 'Notes', { section: 'competitions' })}
      />
      <DesktopObject
        emoji="💻" label="Projects" hint="Double-click to open Projects" index={2} reduced={reduced}
        doubleClick
        onActivate={() => openWindow('github', 'Projects')}
      />
      <DesktopObject
        emoji="✍️" label="Blog" hint="Read my Medium article" index={3} reduced={reduced}
        onActivate={() => window.open('https://medium.com/@tiwariaditya005/when-machines-learned-to-remember-5769d86c1b49', '_blank', 'noopener,noreferrer')}
      />
      <DesktopObject
        icon={<PhotosLogo />} label="Photos" hint="Open all pictures" index={4} reduced={reduced}
        onActivate={() => openWindow('photos', 'Photos')}
      />
      <DesktopObject
        icon={<img src="/character.png" className="w-9 h-9 object-contain" style={{ imageRendering: 'pixelated' }} alt="" />}
        label="Jumping Game"
        hint="Double-click to play Hackathon Rush"
        index={5}
        reduced={reduced}
        doubleClick
        onActivate={() => openWindow('hackathon-rush', 'Jumping Game')}
      />
    </div>
  );
}
