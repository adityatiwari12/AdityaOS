import { useRef, useState, useCallback } from 'react';
import {
  BsLinkedin, BsPlayCircleFill, BsGraphUp, BsCalendar,
  BsStickyFill, BsFilePdf, BsRocket, BsImages, BsJournalRichtext,
  BsFolder2, BsInstagram, BsCameraFill,
} from 'react-icons/bs';
import { RiTerminalFill } from 'react-icons/ri';
import { userConfig } from '../../config/index';
import { useOSStore } from '../../stores/osStore';
import type { AppId } from '../../os/types';

interface MobileDockProps {
  onNotesClick: () => void;
  onVideosClick: () => void;
  onContributionsClick: () => void;
  onCalendarClick: () => void;
}

type DockApp = {
  id: AppId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  onOpen: () => void;
};

type DockLink = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  onClick: () => void;
};

export default function MobileDock(props: MobileDockProps) {
  const openWindow = useOSStore((s) => s.openWindow);
  const setMobileOpenOrigin = useOSStore((s) => s.setMobileOpenOrigin);
  const minimizeAllExcept = useOSStore((s) => s.minimizeAllExcept);

  const [touchX, setTouchX] = useState<number | null>(null);
  const iconRefs = useRef<(HTMLElement | null)[]>([]);

  const open = (id: AppId, title: string) => openWindow(id, title);

  const getScale = useCallback((index: number): number => {
    if (touchX === null) return 1;
    const el = iconRefs.current[index];
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const dist = Math.abs(touchX - (rect.left + rect.width / 2));
    return dist < 70 ? 1 + (1 - dist / 70) * 0.45 : 1;
  }, [touchX]);

  const apps: DockApp[] = [
    { id: 'terminal',      label: 'Copilot',   icon: RiTerminalFill,    color: 'from-emerald-700 to-emerald-500', onOpen: () => open('terminal', 'AI Copilot') },
    { id: 'videos',        label: 'Videos',    icon: BsPlayCircleFill,  color: 'from-rose-600 to-rose-400',       onOpen: props.onVideosClick },
    { id: 'notes',         label: 'Notes',     icon: BsStickyFill,      color: 'from-yellow-500 to-yellow-300',   onOpen: props.onNotesClick },
    { id: 'contributions', label: 'Activity',  icon: BsGraphUp,         color: 'from-cyan-600 to-cyan-400',       onOpen: props.onContributionsClick },
    { id: 'collaboration', label: 'Meet',      icon: BsCalendar,        color: 'from-blue-600 to-blue-400',       onOpen: props.onCalendarClick },
    { id: 'camera',        label: 'Camera',    icon: BsCameraFill,      color: 'from-zinc-700 to-zinc-500',       onOpen: () => open('camera', 'Camera') },
    { id: 'founder-hq',   label: 'Founder',   icon: BsRocket,          color: 'from-orange-600 to-orange-400',   onOpen: () => open('founder-hq', 'Founder HQ') },
    { id: 'resume',        label: 'Resume',    icon: BsFilePdf,         color: 'from-red-600 to-red-400',         onOpen: () => open('resume', 'Resume') },
    { id: 'research-center', label: 'Research', icon: BsJournalRichtext, color: 'from-indigo-600 to-indigo-400', onOpen: () => open('research-center', 'Research Center') },
    { id: 'photos',        label: 'Photos',    icon: BsImages,          color: 'from-pink-500 to-amber-400',      onOpen: () => open('photos', 'Photos') },
    { id: 'finder',        label: 'Finder',    icon: BsFolder2,         color: 'from-blue-500 to-blue-300',       onOpen: () => open('finder', 'Finder') },
  ];

  const links: DockLink[] = [
    { id: 'linkedin',  label: 'LinkedIn',  icon: BsLinkedin,  color: 'from-[#0a66c2] to-[#0a66c2]',           onClick: () => window.open(userConfig.social.linkedin, '_blank', 'noopener,noreferrer') },
    { id: 'instagram', label: 'Instagram', icon: BsInstagram, color: 'from-pink-600 via-rose-500 to-amber-400', onClick: () => window.open('https://www.instagram.com/aditya.tiwari._/', '_blank', 'noopener,noreferrer') },
  ];

  const all = [...apps, ...links];

  const handleAppClick = (app: DockApp, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2 - 56;
    setMobileOpenOrigin(app.id, `${x}px ${y}px`);
    minimizeAllExcept(app.id);
    app.onOpen();
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:hidden z-[150] px-2 pt-1.5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
      role="navigation"
      aria-label="Mobile dock"
    >
      <div className="glass shadow-dock rounded-[20px] px-2 py-2">
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
          onTouchMove={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={() => setTouchX(null)}
          onTouchCancel={() => setTouchX(null)}
        >
          {all.map((item, index) => {
            const Icon = item.icon;
            const scale = getScale(index);
            const isApp = 'onOpen' in item;
            return (
              <button
                key={item.id}
                onClick={isApp ? (e) => handleAppClick(item as DockApp, e) : (item as DockLink).onClick}
                aria-label={item.label}
                className="flex flex-col items-center gap-0.5 shrink-0 snap-start"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'bottom center',
                  transition: touchX === null ? 'transform 0.2s ease-out' : 'none',
                }}
              >
                <span
                  ref={(el) => { iconRefs.current[index] = el; }}
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}
                >
                  <Icon size={22} className="text-white" />
                </span>
                <span className="text-[8px] text-white/65 leading-none w-11 text-center truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
