import MissionControl from '../global/MissionControl';

interface CareerControlOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeApps: Record<string, boolean>;
  onAppClick: (app: string) => void;
  onAppClose: (app: string) => void;
}

/** Career Control 2.0 — wraps Mission Control with extended app list */
export default function CareerControlOverlay(props: CareerControlOverlayProps) {
  const legacyApps = {
    terminal: props.activeApps.terminal ?? false,
    notes: props.activeApps.notes ?? false,
    github: props.activeApps.github ?? false,
    resume: props.activeApps.resume ?? false,
    spotify: props.activeApps.spotify ?? false,
    intro: props.activeApps.intro ?? false,
    videos: props.activeApps.videos ?? false,
    contributions: props.activeApps.contributions ?? false,
    finder: props.activeApps.finder ?? false,
    'projects-lab': props.activeApps['projects-lab'] ?? false,
    'founder-hq': props.activeApps['founder-hq'] ?? false,
    'hackathon-museum': props.activeApps['hackathon-museum'] ?? false,
    'research-center': props.activeApps['research-center'] ?? false,
    'knowledge-base': props.activeApps['knowledge-base'] ?? false,
    'build-mode': props.activeApps['build-mode'] ?? false,
    'career-control': props.activeApps['career-control'] ?? false,
    'personal-dashboard': props.activeApps['personal-dashboard'] ?? false,
  };

  return (
  <MissionControl
    isOpen={props.isOpen}
    onClose={props.onClose}
    activeApps={legacyApps as never}
    onAppClick={props.onAppClick as never}
    onAppClose={props.onAppClose as never}
    title="Career Control"
  />
  );
}
