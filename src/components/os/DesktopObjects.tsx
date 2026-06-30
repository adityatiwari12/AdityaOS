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

/** Open-book glyph for Research, matching the line-icon language used elsewhere. */
function ResearchLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" aria-hidden="true">
      <defs>
        <linearGradient id="research-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <path d="M50 28 C42 20 28 18 16 22 V72 C28 68 42 70 50 78 C58 70 72 68 84 72 V22 C72 18 58 20 50 28 Z" fill="url(#research-grad)" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
      <line x1="50" y1="28" x2="50" y2="78" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
      <line x1="24" y1="34" x2="42" y2="31" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="44" x2="42" y2="41" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="58" y1="31" x2="76" y2="34" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="58" y1="41" x2="76" y2="44" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Award-ribbon glyph for Trophies/wins. */
function TrophyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" aria-hidden="true">
      <defs>
        <linearGradient id="trophy-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <path d="M32 16h36v26c0 11 -8 19 -18 19s-18 -8 -18 -19z" fill="url(#trophy-grad)" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M32 22c-9 0 -14 5 -14 12s5 12 13 13" fill="none" stroke="url(#trophy-grad)" strokeWidth="5" strokeLinecap="round" />
      <path d="M68 22c9 0 14 5 14 12s-5 12 -13 13" fill="none" stroke="url(#trophy-grad)" strokeWidth="5" strokeLinecap="round" />
      <rect x="46" y="58" width="8" height="14" fill="#D97706" />
      <path d="M30 80c0 -6 9 -10 20 -10s20 4 20 10z" fill="#D97706" />
      <circle cx="50" cy="33" r="7" fill="#fff" fillOpacity="0.5" />
    </svg>
  );
}

/** Folder-of-code glyph for Projects. */
function ProjectsLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" aria-hidden="true">
      <defs>
        <linearGradient id="projects-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path d="M14 30c0-3 2-5 5-5h17l7 8h38c3 0 5 2 5 5v38c0 3-2 5-5 5H19c-3 0-5-2-5-5z" fill="url(#projects-grad)" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M40 48l-8 8 8 8" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 48l8 8-8 8" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="54" y1="46" x2="46" y2="66" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Fountain-pen-on-page glyph for Blog. */
function BlogLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" aria-hidden="true">
      <defs>
        <linearGradient id="blog-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <rect x="20" y="14" width="48" height="62" rx="5" fill="#fff" fillOpacity="0.12" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="29" y1="30" x2="55" y2="30" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="29" y1="40" x2="59" y2="40" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="29" y1="50" x2="48" y2="50" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 72 L76 44 L86 54 L58 82 L46 84 Z" fill="url(#blog-grad)" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" strokeLinejoin="round" />
      <line x1="71" y1="49" x2="81" y2="59" stroke="#0F766E" strokeWidth="2" />
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
        icon={<ResearchLogo />} label="Research" hint="Open Research Papers" index={0} reduced={reduced}
        onActivate={() => openWindow('research-center', 'Research Center')}
      />
      <DesktopObject
        icon={<TrophyLogo />} label="Trophies" hint="Open hackathon wins & awards" index={1} reduced={reduced}
        onActivate={() => openWindow('notes', 'Notes', { section: 'competitions' })}
      />
      <DesktopObject
        icon={<ProjectsLogo />} label="Projects" hint="Double-click to open Projects" index={2} reduced={reduced}
        doubleClick
        onActivate={() => openWindow('github', 'Projects')}
      />
      <DesktopObject
        icon={<BlogLogo />} label="Blog" hint="Read my Medium article" index={3} reduced={reduced}
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
