import { useEffect, useState } from 'react';
import { userConfig } from '../../config/index';
import DraggableWindow from './DraggableWindow';
import { defaultWindowLayout } from '../../lib/windowLayout';

const COMMANDS = [
  '$ git push origin main',
  '$ npm run deploy',
  '$ docker build -t talkwithdb .',
  '$ kubectl apply -f k8s/',
];

function StreamingTerminal({ username }: { username: string }) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setLines((prev) => [...prev.slice(-4), COMMANDS[i % COMMANDS.length]]);
      i += 1;
    }, 2500);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div>$ gh auth status — logged in as {username}</div>
      {lines.map((l, idx) => <div key={idx}>{l} ✓</div>)}
    </>
  );
}

interface GitHubContributionsProps {
  isOpen: boolean;
  onClose: () => void;
}

function getUsername(githubUrl: string): string {
  try {
    const parts = new URL(githubUrl).pathname.split('/').filter(Boolean);
    return parts[0] || 'adityatiwari12';
  } catch {
    return 'adityatiwari12';
  }
}

export default function GitHubContributions({ isOpen, onClose }: GitHubContributionsProps) {
  const [mounted, setMounted] = useState(false);
  const [statsFailed, setStatsFailed] = useState(false);
  const [streakFailed, setStreakFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const username = getUsername(userConfig.social.github);
  const accent = userConfig.theme.accentColor.replace('#', '');

  return (
    <DraggableWindow
      title="GitHub Activity"
      onClose={onClose}
      initialPosition={defaultWindowLayout('contributions').position}
      initialSize={defaultWindowLayout('contributions').size}
      className="bg-[#0d1117]"
    >
      <div className="h-full overflow-y-auto no-scrollbar p-5 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-100">@{username} · Contributions</h2>
          <a
            href={userConfig.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-100 transition-colors"
          >
            View profile →
          </a>
        </div>

        {/* Contribution heatmap */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <img
            src={`https://ghchart.rshah.org/${accent}/${username}`}
            alt={`${username} GitHub contribution heatmap`}
            loading="lazy"
            className="w-full"
          />
        </div>

        {/* Stats + streak cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statsFailed ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-gray-400">
              GitHub stats card is temporarily unavailable.{' '}
              <a href={userConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                View profile on GitHub →
              </a>
            </div>
          ) : (
            <img
              src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=tokyonight&hide_border=true&count_private=true`}
              alt={`${username} GitHub stats`}
              loading="lazy"
              className="w-full rounded-xl"
              onError={() => setStatsFailed(true)}
            />
          )}
          {streakFailed ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-gray-400">
              Streak stats are temporarily unavailable.
            </div>
          ) : (
            <img
              src={`https://streak-stats.demolab.com?user=${username}&theme=tokyonight&hide_border=true`}
              alt={`${username} GitHub streak`}
              loading="lazy"
              className="w-full rounded-xl"
              onError={() => setStreakFailed(true)}
            />
          )}
        </div>

        <p className="text-[11px] text-gray-500">
          Heatmap and stats are generated live from GitHub.
        </p>
        <div className="mt-3 p-3 rounded-lg bg-black/40 font-mono text-xs text-green-400 overflow-hidden">
          <StreamingTerminal username={username} />
        </div>
      </div>
    </DraggableWindow>
  );
}
