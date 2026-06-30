import { motion } from 'framer-motion';
import {
  BsGithub, BsBullseye, BsSpotify, BsCalendarEvent,
  BsCpu, BsMemory, BsGitlab, BsBook, BsCloudRain, BsSun, BsCloud, BsSnow, BsCloudLightningRain,
} from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { useOSStore } from '../../stores/osStore';
import { useSystemWidgets } from './MenuBarWidgets';
import { careerGoals, nowStatus } from '../../config/content/index';
import { userConfig } from '../../config/index';
import { fetchGitHubStreak, type GitHubStreak } from '../../lib/githubStreak';
import type { WeatherResult } from '../../lib/weather';

function githubUsername(url: string): string {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)[0] || 'adityatiwari12';
  } catch {
    return 'adityatiwari12';
  }
}

function weatherIcon(condition?: WeatherResult['condition']) {
  switch (condition) {
    case 'rain': return <BsCloudRain className="text-sky-300" />;
    case 'snow': return <BsSnow className="text-white" />;
    case 'clouds': return <BsCloud className="text-gray-300" />;
    case 'thunderstorm': return <BsCloudLightningRain className="text-indigo-300" />;
    default: return <BsSun className="text-amber-300" />;
  }
}

function Card({ title, icon, children, onClick }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`glass rounded-2xl p-3.5 text-left w-full ${onClick ? 'hover:bg-white/10 transition-colors' : ''}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">
        {icon} {title}
      </div>
      {children}
    </Tag>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mt-1">
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-[1500ms] ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function DesktopWidgets() {
  const booted = useOSStore((s) => s.booted);
  const openWindow = useOSStore((s) => s.openWindow);
  const weather = useOSStore((s) => s.weather);
  const { cpu, mem } = useSystemWidgets();
  const [streak, setStreak] = useState<GitHubStreak | null>(null);

  const username = githubUsername(userConfig.social.github);

  useEffect(() => {
    if (!booted) return;
    let active = true;
    fetchGitHubStreak(username).then((s) => { if (active) setStreak(s); });
    return () => { active = false; };
  }, [booted, username]);

  if (!booted) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, type: 'spring', stiffness: 220, damping: 26 }}
      className="hidden xl:flex flex-col gap-3 fixed right-5 top-16 w-60 z-[5] max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pr-1 text-gray-100"
      aria-label="Desktop widgets"
    >
      <Card title="Weather" icon={weatherIcon(weather?.condition)}>
        {weather ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{weather.temp}°C</span>
            <span className="text-xs text-gray-400">{weather.description} · {weather.city}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500">Locating…</span>
        )}
      </Card>

      <Card title="GitHub Streak" icon={<BsGithub />} onClick={() => openWindow('contributions', 'GitHub Activity')}>
        {streak ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-orange-400">{streak.current}</span>
              <span className="text-xs text-gray-400">day{streak.current === 1 ? '' : 's'} 🔥</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Longest {streak.longest} · {streak.total} contributions / yr
            </p>
          </>
        ) : (
          <span className="text-xs text-gray-500">Loading…</span>
        )}
      </Card>

      <Card title="Current Focus" icon={<BsBullseye className="text-rose-300" />}>
        <p className="text-sm text-gray-200 leading-snug">{careerGoals.currentFocus}</p>
      </Card>

      <Card title="Spotify" icon={<BsSpotify className="text-green-400" />} onClick={() => openWindow('spotify', 'Spotify')}>
        <p className="text-sm text-gray-200 leading-snug">{nowStatus.listening}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Tap to play ▶</p>
      </Card>

      <Card title="Upcoming Events" icon={<BsCalendarEvent className="text-sky-300" />}>
        <ul className="space-y-1">
          {nowStatus.upcomingEvents.map((e) => (
            <li key={e} className="text-xs text-gray-300 flex gap-1.5">
              <span className="text-sky-400">›</span> {e}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="CPU" icon={<BsCpu className="text-sky-300" />}>
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>Load</span><span className="tabular-nums">{cpu.toFixed(0)}%</span>
        </div>
        <MiniBar value={cpu} color="bg-sky-400" />
      </Card>

      <Card title="Memory" icon={<BsMemory className="text-violet-300" />}>
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>Usage</span><span className="tabular-nums">{mem.toFixed(0)}%</span>
        </div>
        <MiniBar value={mem} color="bg-violet-400" />
      </Card>

      <Card title="Latest Commit" icon={<BsGitlab className="text-orange-300" />} onClick={() => openWindow('github', 'Projects')}>
        <p className="text-sm text-gray-200 leading-snug font-mono">feat: ship AdityaOS desktop</p>
        <p className="text-[11px] text-gray-500 mt-0.5">adityatiwari12/portfolio</p>
      </Card>

      <Card title="Current Reading" icon={<BsBook className="text-amber-300" />}>
        <p className="text-sm text-gray-200 leading-snug">{careerGoals.reading}</p>
      </Card>
    </motion.aside>
  );
}
