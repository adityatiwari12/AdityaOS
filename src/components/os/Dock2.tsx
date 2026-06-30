import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dockApps } from '../../os/appRegistry';
import { useOSStore } from '../../stores/osStore';
import type { AppId } from '../../os/types';
import ResumeViewer from '../global/ResumeViewer';
import SpotifyPlayer from '../global/SpotifyPlayer';
import { userConfig } from '../../config/index';
import { BsLinkedin, BsGithub, BsCalendar } from 'react-icons/bs';
import { IoIosMail } from 'react-icons/io';

export default function Dock2() {
  const openWindow = useOSStore((s) => s.openWindow);
  const windows = useOSStore((s) => s.windows);
  const recentApps = useOSStore((s) => s.recentApps);
  const booted = useOSStore((s) => s.booted);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ appId: AppId; x: number; y: number } | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const isActive = (appId: AppId) => windows.some((w) => w.appId === appId && !w.minimized);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dockRef.current) return;
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientY >= rect.top - 60 ? e.clientX : null);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const scale = (i: number, total: number) => {
    if (mouseX === null || !dockRef.current) return 1;
    const rect = dockRef.current.getBoundingClientRect();
    const iconW = rect.width / total;
    const center = rect.left + i * iconW + iconW / 2;
    const dist = Math.abs(mouseX - center);
    if (dist > iconW * 2.5) return 1;
    return 1 + (1 - dist / (iconW * 2.5)) * 0.5;
  };

  const handleClick = (appId: AppId, title: string) => {
    if (appId === 'resume') { setShowResume(true); return; }
    if (appId === 'spotify') { setShowSpotify(true); return; }
    openWindow(appId, title);
  };

  if (!booted) return null;

  return (
    <>
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 24 }}
        aria-label="Dock"
        className="fixed bottom-0 left-0 right-0 hidden md:flex justify-center pb-4 z-[80]"
      >
        <div ref={dockRef} className="glass shadow-dock rounded-[22px] px-3 py-2.5 relative">
          <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-white/5 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="flex gap-3">
            {dockApps.map((app, i) => {
              const Icon = app.icon;
              const active = isActive(app.id);
              return (
                <motion.button
                  key={app.id}
                  onClick={() => handleClick(app.id, app.title)}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ appId: app.id, x: e.clientX, y: e.clientY }); }}
                  onMouseEnter={() => setHovered(app.id)}
                  onMouseLeave={() => setHovered(null)}
                  animate={{ scale: scale(i, dockApps.length) }}
                  whileTap={{ scale: 0.9 }}
                  className="relative group"
                  aria-label={app.title}
                  data-tour-id={`dock-${app.id}`}
                >
                  <div className={`w-16 h-16 bg-gradient-to-t ${app.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon size={36} className="text-white" />
                  </div>
                  {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full" />}
                  {hovered === app.id && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {app.title}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {contextMenu && (
        <div className="fixed z-[200] bg-gray-900/95 border border-white/10 rounded-lg py-1 text-sm text-gray-200 shadow-xl" style={{ left: contextMenu.x, top: contextMenu.y - 120 }}>
          <button onClick={() => { handleClick(contextMenu.appId, contextMenu.appId); setContextMenu(null); }} className="block w-full text-left px-4 py-2 hover:bg-white/10">Open</button>
          {recentApps.slice(0, 3).map((a) => (
            <button key={a} onClick={() => { openWindow(a, a); setContextMenu(null); }} className="block w-full text-left px-4 py-2 hover:bg-white/10 text-gray-400">Recent: {a}</button>
          ))}
        </div>
      )}

      <ResumeViewer isOpen={showResume} onClose={() => setShowResume(false)} />
      <SpotifyPlayer isOpen={showSpotify} onClose={() => setShowSpotify(false)} playlistId={userConfig.spotify.playlistId} />
    </>
  );
}
