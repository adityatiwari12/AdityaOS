import { lazy } from 'react';
import {
  BsGithub, BsStickyFill, BsFilePdf, BsPlayCircleFill, BsGraphUp,
  BsFolder2, BsRocket, BsJournalRichtext,
  BsBarChart, BsCalendar, BsDiagram3, BsImages,
} from 'react-icons/bs';
import { RiTerminalFill, RiTerminalBoxFill } from 'react-icons/ri';
import type { AppDefinition } from './types';

const HackathonRushIcon = ({ size = 20 }: { size?: number; className?: string }) => (
  <img src="/character.png" width={size} height={size} style={{ imageRendering: 'pixelated', objectFit: 'contain' }} alt="" />
);

import IntroApp from './wrappers/IntroApp';
import TerminalApp from './wrappers/TerminalApp';
import NotesAppWrapper from './wrappers/NotesAppWrapper';
import GitHubApp from './wrappers/GitHubApp';
import ResumeApp from './wrappers/ResumeApp';
import SpotifyApp from './wrappers/SpotifyApp';
import VideosApp from './wrappers/VideosApp';
import ContributionsApp from './wrappers/ContributionsApp';

import Finder from '../components/apps/Finder';
import FounderHQ from '../components/apps/FounderHQ';
import ResearchCenter from '../components/apps/ResearchCenter';
import Collaboration from '../components/apps/Collaboration';
import Photos from '../components/apps/Photos';
import HackathonRush from '../components/apps/HackathonRush';
const AnalyticsDashboard = lazy(() => import('../components/apps/AnalyticsDashboard'));
const ArchitectureViewer = lazy(() => import('../components/os/ArchitectureViewer'));

export const appRegistry: AppDefinition[] = [
  { id: 'intro', title: 'Intro', icon: RiTerminalBoxFill, color: 'from-gray-800 to-gray-600', component: IntroApp, singleton: true, dock: false, legacyWindow: true },
  { id: 'terminal', title: 'AI Copilot', icon: RiTerminalFill, color: 'from-emerald-700 to-emerald-500', component: TerminalApp, singleton: true, dock: true, legacyWindow: true },
  { id: 'github', title: 'Projects', icon: BsGithub, color: 'from-black to-black/60', component: GitHubApp, singleton: true, dock: true, legacyWindow: true },
  { id: 'videos', title: 'Project Videos', icon: BsPlayCircleFill, color: 'from-rose-600 to-rose-400', component: VideosApp, singleton: true, dock: true, legacyWindow: true },
  { id: 'contributions', title: 'GitHub Activity', icon: BsGraphUp, color: 'from-cyan-600 to-cyan-400', component: ContributionsApp, singleton: true, dock: false, legacyWindow: true },
  { id: 'notes', title: 'Notes', icon: BsStickyFill, color: 'from-yellow-600 to-yellow-400', component: NotesAppWrapper, singleton: true, dock: true, legacyWindow: true },
  { id: 'resume', title: 'Resume', icon: BsFilePdf, color: 'from-red-600 to-red-400', component: ResumeApp, singleton: true, dock: true, legacyWindow: true },
  { id: 'spotify', title: 'Spotify', icon: BsPlayCircleFill, color: 'from-green-600 to-green-400', component: SpotifyApp, singleton: true, dock: false, legacyWindow: true },
  { id: 'finder', title: 'Finder', icon: BsFolder2, color: 'from-blue-500 to-blue-300', component: Finder, singleton: true, dock: true, lazy: false },
  { id: 'founder-hq', title: 'Founder HQ', icon: BsRocket, color: 'from-orange-600 to-orange-400', component: FounderHQ, singleton: true, dock: true, lazy: false },
  { id: 'research-center', title: 'Research Center', icon: BsJournalRichtext, color: 'from-indigo-600 to-indigo-400', component: ResearchCenter, singleton: true, dock: false, lazy: false },
  { id: 'analytics', title: 'Analytics', icon: BsBarChart, color: 'from-fuchsia-600 to-fuchsia-400', component: AnalyticsDashboard, singleton: true, dock: false, lazy: true },
  { id: 'collaboration', title: 'Book Meeting', icon: BsCalendar, color: 'from-blue-600 to-blue-400', component: Collaboration, singleton: true, dock: true, lazy: false },
  { id: 'photos', title: 'Photos', icon: BsImages, color: 'from-pink-500 to-amber-400', component: Photos, singleton: true, dock: false, lazy: false },
  { id: 'architecture-viewer', title: 'Architecture', icon: BsDiagram3, color: 'from-slate-600 to-slate-400', component: ArchitectureViewer, singleton: false, dock: false, lazy: true },
  { id: 'hackathon-rush', title: 'Jumping Game', icon: HackathonRushIcon, color: 'from-violet-600 to-indigo-400', component: HackathonRush, singleton: true, dock: false, lazy: false },
];

export function getAppDefinition(appId: string) {
  return appRegistry.find((a) => a.id === appId);
}

export const dockApps = appRegistry.filter((a) => a.dock !== false);
