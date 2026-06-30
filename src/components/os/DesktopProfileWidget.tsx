import { motion } from 'framer-motion';
import { BsGithub, BsJournalRichtext, BsRocket, BsFilePdf, BsStickyFill, BsGeoAlt } from 'react-icons/bs';
import { useOSStore } from '../../stores/osStore';
import { userConfig } from '../../config/index';
import type { AppId } from '../../os/types';

const STATS = [
  { value: '7', label: 'Hackathon Wins' },
  { value: '4', label: 'Intl Hackathons' },
];

const LINKS: { id: AppId; title: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'github', title: 'Projects', label: 'Projects', icon: BsGithub },
  { id: 'research-center', title: 'Research Center', label: 'Research', icon: BsJournalRichtext },
  { id: 'founder-hq', title: 'Founder HQ', label: 'Startup HQ', icon: BsRocket },
  { id: 'resume', title: 'Resume', label: 'Resume', icon: BsFilePdf },
  { id: 'notes', title: 'Notes', label: 'Notes', icon: BsStickyFill },
];

export default function DesktopProfileWidget() {
  const booted = useOSStore((s) => s.booted);
  const openWindow = useOSStore((s) => s.openWindow);

  if (!booted) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 220, damping: 26 }}
      className="hidden lg:flex flex-col gap-4 fixed left-5 top-24 w-64 z-[5] rounded-2xl p-5 text-gray-100 shadow-dock bg-[rgba(30,30,32,0.42)] backdrop-blur-[30px] backdrop-saturate-[180%] border border-white/[0.08]"
      aria-label="Profile"
    >
      <div className="flex items-center gap-3">
        <img
          src="/images/profile/aditya.png"
          alt={userConfig.name}
          className="w-12 h-12 rounded-full object-cover object-top ring-2 ring-white/20 bg-white/5 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs text-gray-400">👋 Welcome Back</p>
          <h2 className="text-lg font-semibold leading-tight truncate">{userConfig.name}</h2>
          <p className="text-xs text-gray-400">Founder • Engineer</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-gray-300">Co-Founder &amp; CPO</span>
        <span className="font-medium text-orange-300">Tokenistt</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-gray-300">SDE at</span>
        <span className="font-medium text-orange-300">Mythos, Singapore</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <BsGeoAlt size={12} /> {userConfig.location}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-2 text-center">
            <p className="text-base font-semibold text-amber-300 leading-none">{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/10" />

      <nav className="flex flex-col gap-1">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <button
              key={l.id}
              onClick={() => openWindow(l.id, l.title)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors text-left"
            >
              <Icon size={15} className="text-gray-400" />
              {l.label}
            </button>
          );
        })}
      </nav>
    </motion.aside>
  );
}
