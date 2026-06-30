import { motion } from 'framer-motion';
import { RiTerminalFill } from 'react-icons/ri';
import { BsGithub, BsRocket, BsFilePdf, BsJournalRichtext, BsImages, BsGeoAlt, BsFolder2 } from 'react-icons/bs';
import { useOSStore } from '../../stores/osStore';
import { userConfig } from '../../config/index';
import type { AppId } from '../../os/types';

const STATS = [
  { value: '7', label: 'Hackathon Wins' },
  { value: '4', label: 'Intl Hackathons' },
];

type AppIcon = {
  id: AppId;
  title: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  imgSrc?: string;
  color: string;
};

const APP_ICONS: AppIcon[] = [
  { id: 'terminal', title: 'AI Copilot', label: 'AI Copilot', icon: RiTerminalFill, color: 'from-emerald-700 to-emerald-500' },
  { id: 'github', title: 'Projects', label: 'Projects', icon: BsGithub, color: 'from-gray-800 to-gray-600' },
  { id: 'founder-hq', title: 'Founder HQ', label: 'Founder HQ', icon: BsRocket, color: 'from-orange-600 to-orange-400' },
  { id: 'resume', title: 'Resume', label: 'Resume', icon: BsFilePdf, color: 'from-red-600 to-red-400' },
  { id: 'hackathon-rush', title: 'Jumping Game', label: 'Game', imgSrc: '/appicon.png', color: 'from-violet-600 to-violet-400' },
  { id: 'research-center', title: 'Research Center', label: 'Research', icon: BsJournalRichtext, color: 'from-indigo-600 to-indigo-400' },
  { id: 'photos', title: 'Photos', label: 'Photos', icon: BsImages, color: 'from-pink-500 to-amber-400' },
  { id: 'finder', title: 'Finder', label: 'Finder', icon: BsFolder2, color: 'from-blue-500 to-blue-300' },
];

export default function MobileHomeScreen() {
  const booted = useOSStore((s) => s.booted);
  const openWindow = useOSStore((s) => s.openWindow);
  const setMobileOpenOrigin = useOSStore((s) => s.setMobileOpenOrigin);
  const minimizeAllExcept = useOSStore((s) => s.minimizeAllExcept);

  // OSWindow sits at fixed left-2 (8px) top-20 (80px). Compute origin relative to that element.
  const openApp = (app: typeof APP_ICONS[number], e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;    // left-0 = 0px
    const y = rect.top + rect.height / 2 - 56;  // top-14 = 56px
    setMobileOpenOrigin(app.id, `${x}px ${y}px`);
    minimizeAllExcept(app.id);
    openWindow(app.id, app.title);
  };

  if (!booted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="fixed top-14 left-0 right-0 md:hidden overflow-y-auto no-scrollbar z-[1]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--mobile-dock-clearance, 116px))' }}
    >
      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Profile card */}
        <div className="rounded-2xl bg-black/30 backdrop-blur-[24px] border border-white/10 p-4 text-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/images/profile/aditya.png"
              alt={userConfig.name}
              className="w-14 h-14 rounded-full object-cover object-top ring-2 ring-white/20 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">👋 Welcome Back</p>
              <h2 className="text-base font-semibold leading-tight truncate">{userConfig.name}</h2>
              <p className="text-xs text-gray-400">Founder • Engineer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-gray-300 text-xs">Co-Founder &amp; CPO</span>
            <span className="font-medium text-orange-300 text-xs">Tokenistt</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-gray-300 text-xs">SDE at</span>
            <span className="font-medium text-orange-300 text-xs">Mythos, Singapore</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
            <BsGeoAlt size={11} />
            <span>{userConfig.location}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-2 text-center">
                <p className="text-base font-semibold text-amber-300 leading-none">{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* App icon grid */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {APP_ICONS.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={(e) => openApp(app, e)}
                className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
              >
                <span className={`w-14 h-14 rounded-2xl bg-gradient-to-t ${app.color} flex items-center justify-center shadow-lg overflow-hidden`}>
                  {app.imgSrc
                    ? <img src={app.imgSrc} alt={app.label} className="w-full h-full object-cover" />
                    : Icon && <Icon size={28} className="text-white" />
                  }
                </span>
                <span className="text-[10px] text-white/75 leading-none text-center">{app.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
}
