import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Spotlight from '../components/global/Spotlight';
import MacToolbar from '../components/global/MacToolbar';
import MobileDock from '../components/global/MobileDock';
import ShortcutsOverlay from '../components/global/ShortcutsOverlay';
import ContactWidget from '../components/global/ContactWidget';
import MobileHomeScreen from '../components/global/MobileHomeScreen';
import LockScreen from '../components/global/LockScreen';
import MobileNotification from '../components/global/MobileNotification';
import WallpaperContextMenu from '../components/global/WallpaperContextMenu';
import BootSequence from '../components/os/BootSequence';
import DesktopWallpaper from '../components/os/DesktopWallpaper';
import DesktopProfileWidget from '../components/os/DesktopProfileWidget';
import DesktopObjects from '../components/os/DesktopObjects';
import Dock2 from '../components/os/Dock2';
import MenuBarWidgets from '../components/os/MenuBarWidgets';
import WindowManager from '../os/WindowManager';
import { getAppDefinition } from '../os/appRegistry';
import CareerControlOverlay from '../components/os/CareerControlOverlay';
import { useOSStore } from '../stores/osStore';
import { initKonamiCode, triggerKernelPanic } from '../lib/easterEggs';
import { trackPageView, trackAppOpen } from '../lib/analytics';
import type { NotesSection } from '../components/global/NotesApp';

interface AppLayoutProps {
  initialBg: string;
  backgroundMap: Record<string, string>;
}

export default function Desktop({ initialBg, backgroundMap }: AppLayoutProps) {
  const [currentBg, setCurrentBg] = useState(initialBg);
  const booted = useOSStore((s) => s.booted);
  const kernelPanic = useOSStore((s) => s.kernelPanic);
  const retroMode = useOSStore((s) => s.retroMode);
  const openWindow = useOSStore((s) => s.openWindow);
  const closeAllWindows = useOSStore((s) => s.closeAllWindows);
  const setCustomWallpaper = useOSStore((s) => s.setCustomWallpaper);
  const windows = useOSStore((s) => s.windows);

  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isCareerControlOpen, setIsCareerControlOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  // Default to locked=true (SSR-safe). useEffect checks sessionStorage after hydration.
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('adityaos-unlocked')) setLocked(false);
  }, []);
  const [timeOverlay, setTimeOverlay] = useState('rgba(0,0,0,0)');

  const handleUnlock = () => {
    sessionStorage.setItem('adityaos-unlocked', '1');
    setLocked(false);
  };

  const activeApps = Object.fromEntries(
    ['intro', 'terminal', 'notes', 'github', 'resume', 'spotify', 'videos', 'contributions',
      'finder', 'projects-lab', 'founder-hq', 'hackathon-museum', 'research-center',
      'knowledge-base', 'build-mode', 'career-control', 'personal-dashboard', 'analytics', 'collaboration',
    ].map((id) => [id, windows.some((w) => w.appId === id && !w.minimized)])
  ) as Record<string, boolean>;

  useEffect(() => {
    trackPageView();
  }, [booted]);

  // Slowly shift wallpaper tint based on real time of day
  useEffect(() => {
    const compute = () => {
      const frac = new Date().getHours() + new Date().getMinutes() / 60;
      if (frac >= 5 && frac < 8) return `rgba(255,200,80,${((frac - 5) / 3) * 0.06})`;
      if (frac >= 17 && frac < 19) return `rgba(255,120,30,${((frac - 17) / 2) * 0.1})`;
      if (frac >= 19 && frac < 21) return `rgba(120,40,180,${0.10 + ((frac - 19) / 2) * 0.08})`;
      if (frac >= 21 || frac < 5) return 'rgba(20,10,60,0.18)';
      return 'rgba(0,0,0,0)';
    };
    setTimeOverlay(compute());
    const t = setInterval(() => setTimeOverlay(compute()), 60000);
    return () => clearInterval(t);
  }, []);

  // Restore persisted wallpaper after hydration so SSR and the first client paint match.
  useEffect(() => {
    const storedWallpaper = localStorage.getItem('adityaos-custom-wallpaper');
    if (storedWallpaper) setCustomWallpaper(storedWallpaper);

    const storedBg = localStorage.getItem('lastBackground');
    if (storedBg && backgroundMap[storedBg]) setCurrentBg(storedBg);
  }, [backgroundMap, setCustomWallpaper]);

  // Safety net: if a stale service-worker serves an outdated lazy chunk after a
  // deploy, Vite emits `vite:preloadError`. Force a single fresh reload so the
  // app picks up the new chunk hashes instead of silently failing to open.
  useEffect(() => {
    const onPreloadError = (e: Event) => {
      e.preventDefault();
      if (sessionStorage.getItem('chunk-reloaded') === '1') return;
      sessionStorage.setItem('chunk-reloaded', '1');
      window.location.reload();
    };
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);

  useEffect(() => {
    if (!booted) return;
    // On mobile, stacked fullscreen windows are unusable — open only the Intro.
    // On desktop, open all three back-to-front so Intro lands on top of the cascade.
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      openWindow('intro', 'Intro');
      return;
    }
    openWindow('contributions', 'GitHub Activity');
    openWindow('videos', 'Project Videos');
    openWindow('intro', 'Intro');
  }, [booted, openWindow]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSpotlightOpen(true);
      } else if (e.key === '?' || (cmdOrCtrl && (e.key === 'h' || e.key === 'H'))) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      } else if ((cmdOrCtrl && e.key === 'ArrowUp') || e.key === 'F3') {
        e.preventDefault();
        setIsCareerControlOpen((m) => !m);
      } else if (cmdOrCtrl && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsContactOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    return initKonamiCode(() => {
      triggerKernelPanic();
      openWindow('research-center', 'Research Center');
    });
  }, [openWindow]);

  const openNotesSection = (section: NotesSection) => {
    openWindow('notes', 'Notes', { section });
  };

  const shuffleBackground = () => {
    const keys = Object.keys(backgroundMap).filter((k) => k !== currentBg);
    if (!keys.length) return;
    const newBg = keys[Math.floor(Math.random() * keys.length)];
    // Clear any uploaded custom wallpaper so the shuffled photo is actually visible
    setCustomWallpaper(null);
    setCurrentBg(newBg);
    localStorage.setItem('lastBackground', newBg);
  };

  const handleAppOpen = (app: string) => {
    trackAppOpen(app);
    const def = getAppDefinition(app);
    openWindow(app as never, def?.title ?? app);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${retroMode ? 'sepia contrast-125' : ''}`} style={{ height: '100dvh' }}>
      <BootSequence />
      <DesktopWallpaper backgroundMap={backgroundMap} fallbackBg={currentBg} />

      {/* Time-of-day tint — slowly warms/cools based on real clock */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none transition-[background-color] duration-[30000ms]"
        style={{ backgroundColor: timeOverlay }}
      />

      <AnimatePresence>
        {kernelPanic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black text-white p-8 font-mono text-sm"
          >
            <p>You need to restart your computer. Hold down Command and Control until restart.</p>
            <p className="mt-4 text-gray-500">(Just kidding — press any key)</p>
          </motion.div>
        )}
      </AnimatePresence>

      {booted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-[200]"
        >
          <MacToolbar
            onOpenSpotlight={() => setIsSpotlightOpen(true)}
            onOpenMissionControl={() => setIsCareerControlOpen(true)}
            onOpenContact={() => setIsContactOpen(true)}
            onToggleShortcuts={() => setShowShortcuts((s) => !s)}
            onCloseAllWindows={closeAllWindows}
            onShuffleBackground={shuffleBackground}
            extraRight={<MenuBarWidgets />}
          />
        </motion.div>
      )}

      {booted && <DesktopObjects />}
      {booted && <DesktopProfileWidget />}
      <MobileHomeScreen />

      {booted && <WindowManager />}

      {booted && (
        <MobileDock
          onNotesClick={() => handleAppOpen('notes')}
          onVideosClick={() => handleAppOpen('videos')}
          onContributionsClick={() => handleAppOpen('contributions')}
          onCalendarClick={() => handleAppOpen('collaboration')}
        />
      )}

      {booted && <Dock2 />}

      <Spotlight
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        actions={{
          openTerminal: () => handleAppOpen('terminal'),
          openNotes: () => handleAppOpen('notes'),
          openContact: () => setIsContactOpen(true),
          openNotesSection: (s) => openNotesSection(s as NotesSection),
          openGitHub: () => handleAppOpen('github'),
          openResume: () => handleAppOpen('resume'),
          openFinder: () => handleAppOpen('finder'),
          openFounderHQ: () => handleAppOpen('founder-hq'),
          openResearch: () => handleAppOpen('research-center'),
          closeAllWindows,
          shuffleBackground,
          openProjectById: (id) => { openWindow('github', 'Projects', { projectId: id }); },
        }}
      />

      <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ContactWidget open={isContactOpen} onClose={() => setIsContactOpen(false)} />

      <AnimatePresence>
        {locked && <LockScreen key="lock" onUnlock={handleUnlock} />}
      </AnimatePresence>

      {!locked && booted && <MobileNotification />}
      {booted && <WallpaperContextMenu onChangeWallpaper={shuffleBackground} />}

      <CareerControlOverlay
        isOpen={isCareerControlOpen}
        onClose={() => setIsCareerControlOpen(false)}
        activeApps={activeApps}
        onAppClick={(app) => { handleAppOpen(app); setIsCareerControlOpen(false); }}
        onAppClose={(app) => useOSStore.getState().closeApp(app as never)}
      />
    </div>
  );
}
