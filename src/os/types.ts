import type { ComponentType } from 'react';

export type AppId =
  | 'intro'
  | 'terminal'
  | 'notes'
  | 'github'
  | 'resume'
  | 'spotify'
  | 'videos'
  | 'contributions'
  | 'finder'
  | 'projects-lab'
  | 'founder-hq'
  | 'hackathon-museum'
  | 'research-center'
  | 'knowledge-base'
  | 'build-mode'
  | 'career-control'
  | 'personal-dashboard'
  | 'analytics'
  | 'collaboration'
  | 'photos'
  | 'architecture-viewer'
  | 'hackathon-rush'
  | 'camera';

export interface WindowPayload {
  section?: string;
  projectId?: string;
  folderId?: string;
  paperId?: string;
  trophyId?: string;
  graphId?: string;
  highlightId?: string;
  [key: string]: unknown;
}

export interface AppWindowProps {
  windowId: string;
  onClose: () => void;
  payload?: WindowPayload;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  focused: boolean;
  payload?: WindowPayload;
  className?: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm';

export interface WeatherState {
  temp: number;
  condition: WeatherCondition;
  description: string;
  timezone: string;
  city?: string;
}

export interface AppDefinition {
  id: AppId;
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  component: ComponentType<AppWindowProps>;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  singleton?: boolean;
  dock?: boolean;
  lazy?: boolean;
  className?: string;
  /** Legacy apps render their own DraggableWindow shell */
  legacyWindow?: boolean;
}

export type MediaKind = 'photos' | 'reel';

export type CopilotAction =
  | { type: 'openWindow'; appId: AppId; payload?: WindowPayload }
  | { type: 'closeWindow'; appId?: AppId }
  | { type: 'highlight'; targetId: string }
  | { type: 'navigate'; path: string }
  | { type: 'showMedia'; media: MediaKind }
  | { type: 'message'; content: string };
