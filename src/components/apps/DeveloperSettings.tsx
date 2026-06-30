import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BsSearch, BsCpu, BsDiagram3, BsDatabase, BsLayersHalf, BsFolderFill,
  BsStack, BsGraphUp, BsShieldLock, BsLightningCharge, BsClockHistory,
  BsArrowDown, BsArrowRight, BsChevronRight, BsChevronDown,
  BsCircleFill, BsCheck2,
} from 'react-icons/bs';
import { useOSStore } from '../../stores/osStore';
import type { AppWindowProps } from '../../os/types';

type SectionId =
  | 'architecture' | 'ai-pipeline' | 'state-management' | 'window-manager'
  | 'folder-structure' | 'tech-stack' | 'performance' | 'security'
  | 'cost-optimization' | 'version-history';

const SECTIONS: { id: SectionId; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'architecture',       label: 'Architecture',          Icon: BsDiagram3 },
  { id: 'ai-pipeline',        label: 'AI Pipeline',           Icon: BsCpu },
  { id: 'state-management',   label: 'State Management',      Icon: BsDatabase },
  { id: 'window-manager',     label: 'Window Manager',        Icon: BsLayersHalf },
  { id: 'folder-structure',   label: 'Folder Structure',      Icon: BsFolderFill },
  { id: 'tech-stack',         label: 'Tech Stack',            Icon: BsStack },
  { id: 'performance',        label: 'Performance',           Icon: BsGraphUp },
  { id: 'security',           label: 'Security',              Icon: BsShieldLock },
  { id: 'cost-optimization',  label: 'AI Cost Optimization',  Icon: BsLightningCharge },
  { id: 'version-history',    label: 'Version History',       Icon: BsClockHistory },
];

// ── Shared ─────────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-xs text-white/40 mt-1">{subtitle}</p>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/10 bg-white/5 p-4 ${className}`}>{children}</div>;
}

function FlowArrow() {
  return (
    <div className="flex flex-col items-center my-0.5">
      <div className="w-px h-3 bg-white/20" />
      <BsArrowDown size={9} className="text-white/35" />
    </div>
  );
}

// ── Architecture ───────────────────────────────────────────────────────────────

function ArchitectureSection() {
  const layers = [
    { label: 'Browser Layer', sub: 'React 19 Islands · Framer Motion · Zustand', desc: 'Only island components hydrate — zero JS for static content.', dot: 'bg-sky-400', border: 'border-sky-500/30 bg-sky-500/10' },
    { label: 'Astro 5 SSR', sub: 'src/pages/ · API Routes · Env secrets', desc: 'Server-renders HTML, handles API proxies, never exposes keys.', dot: 'bg-violet-400', border: 'border-violet-500/30 bg-violet-500/10' },
    { label: 'Vercel Edge Network', sub: 'CDN · Serverless Functions · Node 22', desc: '40-region global deployment, preview per commit, instant rollback.', dot: 'bg-slate-400', border: 'border-slate-500/30 bg-slate-500/10' },
  ];
  const services = [
    { label: 'Groq API', sub: 'llama-3.3-70b inference', tc: 'text-orange-300', bc: 'border-orange-500/30 bg-orange-500/10' },
    { label: 'Neon Postgres', sub: 'Lead capture + analytics', tc: 'text-green-300', bc: 'border-green-500/30 bg-green-500/10' },
    { label: 'Sarvam TTS', sub: 'Tour voice synthesis', tc: 'text-blue-300', bc: 'border-blue-500/30 bg-blue-500/10' },
  ];
  return (
    <div>
      <SectionHeader title="Architecture" subtitle="System layers from browser to external services" />
      <div className="space-y-1">
        {layers.map((l, i) => (
          <div key={l.label}>
            <motion.div initial={{ x: -14, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.09 }}
              className={`rounded-xl border p-3.5 ${l.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${l.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{l.label}</p>
                    <p className="text-[10px] font-mono text-white/45 mt-0.5">{l.sub}</p>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 text-right max-w-[42%] leading-relaxed">{l.desc}</p>
              </div>
            </motion.div>
            {i < layers.length - 1 && <FlowArrow />}
          </div>
        ))}
        <FlowArrow />
        <div className="grid grid-cols-3 gap-2.5">
          {services.map((s, i) => (
            <motion.div key={s.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.07 }}
              className={`rounded-xl border p-3 ${s.bc}`}>
              <p className={`text-xs font-semibold ${s.tc}`}>{s.label}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-5 p-3.5 rounded-xl bg-white/3 border border-white/8">
        <p className="text-[11px] text-white/40 leading-relaxed">
          <span className="text-white/60 font-medium">Data flow:</span> Browser → Astro API route → Vercel Edge → External API → JSON response → Zustand dispatch → React re-render.
          API keys live only in Vercel env vars — never bundled or shipped to the browser.
        </p>
      </div>
    </div>
  );
}

// ── AI Pipeline ────────────────────────────────────────────────────────────────

function AIPipelineSection() {
  return (
    <div>
      <SectionHeader title="AI Pipeline" subtitle="Every query from input to OS action" />
      <div className="flex flex-col items-center">
        {[
          { label: 'User Input', sub: 'Natural language query in the copilot', c: 'border-sky-500/40 bg-sky-500/10', tc: 'text-sky-300' },
          { label: 'Offline NLP Parser', sub: 'Regex · keyword extraction · intent mapping · action routing', c: 'border-violet-500/40 bg-violet-500/10', tc: 'text-violet-300' },
          { label: 'Confidence Scoring', sub: '0.0–1.0 score based on pattern match strength + intent clarity', c: 'border-amber-500/40 bg-amber-500/10', tc: 'text-amber-300' },
        ].map((step, i) => (
          <div key={step.label} className="flex flex-col items-center w-full">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className={`w-full max-w-md rounded-xl border p-3 ${step.c}`}>
              <p className={`text-sm font-semibold ${step.tc}`}>{step.label}</p>
              <p className="text-[11px] text-white/45 mt-0.5">{step.sub}</p>
            </motion.div>
            <FlowArrow />
          </div>
        ))}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="w-full">
          <div className="flex gap-3 justify-center items-start">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">Score ≥ 0.7</div>
              <div className="w-px h-3 bg-white/20" />
              <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center">
                <p className="text-xs font-semibold text-emerald-300">Local Execution</p>
                <p className="text-[10px] text-white/35 mt-0.5">Zero cost · &lt;5ms</p>
              </div>
            </div>
            <div className="pt-5 text-white/15 text-xs">|</div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">Score &lt; 0.7</div>
              <div className="w-px h-3 bg-white/20" />
              <div className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 p-2.5 text-center">
                <p className="text-xs font-semibold text-orange-300">Groq API</p>
                <p className="text-[10px] text-white/35 mt-0.5">llama-3.3-70b · ~300ms</p>
              </div>
            </div>
          </div>
        </motion.div>

        <FlowArrow />
        {[
          { label: 'Parse OS Actions', sub: 'openWindow · closeWindow · navigate · showMedia · message', c: 'border-violet-500/40 bg-violet-500/10', tc: 'text-violet-300' },
          { label: 'Execute in UI', sub: 'Zustand dispatch · React re-render · framer-motion transition', c: 'border-sky-500/40 bg-sky-500/10', tc: 'text-sky-300' },
        ].map((step, i) => (
          <div key={step.label} className="flex flex-col items-center w-full">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
              className={`w-full max-w-md rounded-xl border p-3 ${step.c}`}>
              <p className={`text-xs font-semibold text-center ${step.tc}`}>{step.label}</p>
              <p className="text-[10px] text-white/45 mt-0.5 text-center">{step.sub}</p>
            </motion.div>
            {i === 0 && <FlowArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── State Management ───────────────────────────────────────────────────────────

function StateManagementSection() {
  const stores = [
    {
      name: 'osStore', file: 'src/stores/osStore.ts', color: 'text-emerald-400',
      state: ['windows: WindowState[]', 'booted: boolean', 'kernelPanic: boolean', 'retroMode: boolean', 'weather: WeatherState', 'customWallpaper: string | null'],
      actions: ['openWindow()', 'closeWindow()', 'focusWindow()', 'minimizeWindow()', 'updateWindowPosition()', 'closeAllWindows()', 'executeCopilotActions()'],
    },
    {
      name: 'tourStore', file: 'src/stores/tourStore.ts', color: 'text-violet-400',
      state: ['running: boolean', 'step: number', 'totalSteps: number', 'muted: boolean', 'captionTitle: string', 'captionBody: string', 'showFinal: boolean'],
      actions: ['startTour()', 'skipTour()', 'toggleMute()', '_advance(step, title, body)', '_finish()'],
    },
  ];
  const lifecycle = [
    { label: 'CLOSED', c: 'bg-white/10 text-white/40' },
    { label: 'OPEN', c: 'bg-sky-500/20 text-sky-300' },
    { label: 'FOCUSED', c: 'bg-emerald-500/20 text-emerald-300' },
    { label: 'MINIMIZED', c: 'bg-amber-500/20 text-amber-300' },
  ];
  return (
    <div>
      <SectionHeader title="State Management" subtitle="Zustand stores powering the entire OS" />
      <div className="space-y-3 mb-6">
        {stores.map((store, i) => (
          <motion.div key={store.name} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-mono text-sm font-bold ${store.color}`}>{store.name}</span>
                <span className="text-[10px] text-white/25 font-mono ml-1">{store.file}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2">State</p>
                  <div className="space-y-1">
                    {store.state.map(s => <p key={s} className="text-[10px] font-mono text-white/55">{s}</p>)}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Actions</p>
                  <div className="space-y-1">
                    {store.actions.map(a => <p key={a} className={`text-[10px] font-mono ${store.color} opacity-70`}>{a}</p>)}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2.5">Window Lifecycle</p>
      <div className="flex items-center gap-2 flex-wrap">
        {lifecycle.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-1 rounded-md ${s.c}`}>{s.label}</span>
            {i < lifecycle.length - 1 && <BsArrowRight size={9} className="text-white/20" />}
          </div>
        ))}
        <BsArrowRight size={9} className="text-white/20" />
        <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/10 text-white/40">CLOSED</span>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-white/3 border border-white/8">
        <p className="text-[10px] text-white/40 leading-relaxed">
          Zustand's <code className="text-white/60">getState()</code> enables imperative dispatch outside React — the tour script and copilot actions use this to trigger window opens without hooks or context.
        </p>
      </div>
    </div>
  );
}

// ── Window Manager ─────────────────────────────────────────────────────────────

function WindowManagerSection() {
  const windows = useOSStore((s) => s.windows);
  const zLayers = [
    { label: 'Tour UI (VirtualCursor, Captions, Skip)', z: '9970–9999', c: 'border-violet-500/40 bg-violet-500/10 text-violet-300' },
    { label: 'Modals (Spotlight, Shortcuts, CareerControl)', z: '9000–9960', c: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
    { label: 'Dock & Menu Bar', z: '200–300', c: 'border-sky-500/40 bg-sky-500/10 text-sky-300' },
    { label: 'App Windows (dynamic z-index promotion)', z: '100–199', c: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { label: 'Desktop Widgets & Wallpaper', z: '1–10', c: 'border-white/15 bg-white/5 text-white/45' },
  ];
  return (
    <div>
      <SectionHeader title="Window Manager" subtitle="Z-index system and live window states" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card>
          <p className="text-[9px] uppercase tracking-wider text-white/25 mb-3">Live Windows</p>
          {windows.length === 0
            ? <p className="text-xs text-white/25 italic">No windows open</p>
            : <div className="space-y-1.5">
                {windows.map(w => (
                  <div key={w.id} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-white/65 truncate">{w.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${w.minimized ? 'bg-amber-500/20 text-amber-400' : w.focused ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/35'}`}>
                      {w.minimized ? 'min' : w.focused ? 'focus' : 'bg'}
                    </span>
                  </div>
                ))}
              </div>
          }
          <p className="text-[10px] text-white/25 mt-3 pt-3 border-t border-white/8">{windows.length} window{windows.length !== 1 ? 's' : ''} open</p>
        </Card>
        <Card>
          <p className="text-[9px] uppercase tracking-wider text-white/25 mb-3">Window Features</p>
          <div className="space-y-1.5">
            {['Drag to reposition', 'Resize via handle', 'Minimize to dock badge', 'Focus → z-index promotion', 'Singleton enforcement', 'Payload pass-through', 'Framer spring on open'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <BsCheck2 size={10} className="text-emerald-400 shrink-0" />
                <span className="text-[10px] text-white/55">{f}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2.5">Z-Index Layers (top to bottom)</p>
      <div className="space-y-1.5">
        {zLayers.map((l, i) => (
          <motion.div key={l.label} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${l.c}`}>
            <span className="text-[11px]">{l.label}</span>
            <span className="text-[10px] font-mono opacity-60">z: {l.z}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Folder Structure ───────────────────────────────────────────────────────────

type TreeNode = { name: string; desc?: string; color?: string; children?: TreeNode[] };

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = !!(node.children?.length);
  return (
    <div>
      <div
        className="flex items-start gap-1.5 py-0.5 px-1 rounded cursor-pointer hover:bg-white/5 group"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        <span className="mt-0.5 shrink-0 w-3">
          {hasChildren
            ? open ? <BsChevronDown size={8} className="text-white/30" /> : <BsChevronRight size={8} className="text-white/30" />
            : null
          }
        </span>
        <span className={`text-[11px] font-mono leading-snug ${node.color ?? 'text-white/60'}`}>{node.name}</span>
        {node.desc && <span className="text-[9px] text-white/20 mt-0.5 ml-1 hidden group-hover:block">{node.desc}</span>}
      </div>
      {hasChildren && open && node.children!.map((c, i) => <TreeItem key={i} node={c} depth={depth + 1} />)}
    </div>
  );
}

const TREE: TreeNode = {
  name: 'src/', color: 'text-white/80',
  children: [
    { name: 'components/', children: [
      { name: 'apps/', color: 'text-sky-400', desc: '16 app components (Camera, FounderHQ, Photos, HackathonRush, DeveloperSettings…)' },
      { name: 'global/', color: 'text-green-400', desc: 'MacToolbar, Spotlight, ContactWidget, NotesApp, TourNotification' },
      { name: 'os/', color: 'text-violet-400', desc: 'WindowManager, VirtualCursor, GuidedTour, BootSequence, Dock2' },
    ]},
    { name: 'config/', color: 'text-amber-400', desc: 'Content data, userConfig, app config' },
    { name: 'layouts/', desc: 'AppLayout.tsx — desktop orchestrator, boot effect, keyboard shortcuts' },
    { name: 'lib/', desc: 'analytics.ts · easterEggs.ts · zIndex.ts' },
    { name: 'os/', children: [
      { name: 'types.ts', color: 'text-amber-300', desc: 'AppId, WindowState, WindowPayload, AppDefinition' },
      { name: 'appRegistry.tsx', color: 'text-amber-300', desc: '20+ app definitions with icons, colors, ideal sizes' },
      { name: 'tourScript.ts', color: 'text-amber-300', desc: '9-step automated recruiter tour with per-photo narration' },
      { name: 'WindowManager.tsx', color: 'text-amber-300', desc: 'Renders all open WindowStates via OSWindow' },
    ]},
    { name: 'pages/', children: [
      { name: 'api/', color: 'text-rose-400', children: [
        { name: 'chat.ts', color: 'text-rose-300', desc: 'Groq copilot proxy — auth + rate limit' },
        { name: 'tts.ts', color: 'text-rose-300', desc: 'Sarvam TTS proxy — key server-only' },
        { name: 'auth.ts', color: 'text-rose-300', desc: 'OAuth token exchange' },
        { name: 'analytics.ts', color: 'text-rose-300', desc: 'Neon Postgres event logging' },
      ]},
      { name: 'index.astro', color: 'text-orange-400', desc: 'Entry point — SSR page serving the React desktop' },
    ]},
    { name: 'stores/', children: [
      { name: 'osStore.ts', color: 'text-emerald-400', desc: 'Windows, booted, weather, wallpaper, retroMode' },
      { name: 'tourStore.ts', color: 'text-emerald-400', desc: 'Tour running/step/muted/captions' },
    ]},
    { name: 'styles/', desc: 'Global CSS, Tailwind utilities, scrollbar styles' },
  ],
};

function FolderStructureSection() {
  return (
    <div>
      <SectionHeader title="Folder Structure" subtitle="Click folders to expand — hover for descriptions" />
      <Card className="mb-4"><TreeItem node={TREE} /></Card>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'App Components', count: '16', c: 'text-sky-400', bc: 'border-sky-500/20 bg-sky-500/8' },
          { label: 'API Routes', count: '6', c: 'text-rose-400', bc: 'border-rose-500/20 bg-rose-500/8' },
          { label: 'Zustand Stores', count: '2', c: 'text-emerald-400', bc: 'border-emerald-500/20 bg-emerald-500/8' },
        ].map(s => (
          <div key={s.label} className={`rounded-lg border p-3 ${s.bc}`}>
            <p className={`text-xl font-bold ${s.c}`}>{s.count}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tech Stack ─────────────────────────────────────────────────────────────────

const TECH = [
  { name: 'Astro 5',      version: '5.x',       emoji: '🚀', bc: 'border-orange-500/30 bg-orange-500/8', tc: 'text-orange-300', reason: 'Zero-JS islands — only hydrates components that need interactivity. Static HTML for everything else.' },
  { name: 'React 19',     version: '19.x',      emoji: '⚛️', bc: 'border-sky-500/30 bg-sky-500/8',    tc: 'text-sky-300',    reason: 'Concurrent features, stable use() hook, and islands pattern is a natural fit for the OS.' },
  { name: 'TypeScript',   version: '5.7',       emoji: '🔷', bc: 'border-blue-500/30 bg-blue-500/8',  tc: 'text-blue-300',   reason: 'AppId union type prevents invalid window opens. WindowPayload index signature enables flexible payloads.' },
  { name: 'Tailwind CSS', version: '4.x',       emoji: '🎨', bc: 'border-teal-500/30 bg-teal-500/8',  tc: 'text-teal-300',   reason: 'Zero dead CSS in production. Design tokens via CSS variables, trivial dark mode theming.' },
  { name: 'Framer Motion',version: '12.x',      emoji: '✨', bc: 'border-violet-500/30 bg-violet-500/8',tc:'text-violet-300', reason: 'Spring physics for the virtual cursor, window drag inertia, boot sequence, and all transitions.' },
  { name: 'Zustand 5',   version: '5.x',       emoji: '🐻', bc: 'border-amber-500/30 bg-amber-500/8', tc: 'text-amber-300',  reason: 'getState() outside React — tour script and copilot dispatch without hooks or context.' },
  { name: 'Groq SDK',    version: '0.x',       emoji: '🤖', bc: 'border-emerald-500/30 bg-emerald-500/8',tc:'text-emerald-300',reason: 'llama-3.3-70b at ~300ms. 10× cheaper than GPT-4 for equivalent conversational quality.' },
  { name: 'Neon Postgres',version: 'serverless',emoji: '🗄️', bc: 'border-green-500/30 bg-green-500/8', tc: 'text-green-300',  reason: 'Serverless Postgres, no cold starts, pay-per-query. Lead capture + analytics events.' },
  { name: 'Vercel',      version: '—',         emoji: '▲',  bc: 'border-slate-500/30 bg-slate-500/8', tc: 'text-slate-300',  reason: 'Zero-config Astro SSR, preview URLs per commit, 40-region CDN, instant rollbacks.' },
  { name: 'Vite',        version: '6.x',       emoji: '⚡', bc: 'border-yellow-500/30 bg-yellow-500/8',tc:'text-yellow-300',  reason: 'Sub-second HMR, optimized production bundles with tree-shaking, PWA plugin.' },
];

function TechStackSection() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div>
      <SectionHeader title="Tech Stack" subtitle="Click any card to see why it was chosen" />
      <div className="grid grid-cols-2 gap-2">
        {TECH.map((t, i) => (
          <motion.button key={t.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => setSelected(selected === t.name ? null : t.name)}
            className={`text-left rounded-xl border p-3 transition-all hover:brightness-125 ${t.bc}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base leading-none">{t.emoji}</span>
              <span className={`text-xs font-semibold ${t.tc}`}>{t.name}</span>
              <span className="text-[9px] text-white/20 font-mono ml-auto">{t.version}</span>
            </div>
            <AnimatePresence mode="wait">
              {selected === t.name
                ? <motion.p key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-white/55 leading-relaxed">{t.reason}</motion.p>
                : <p className="text-[10px] text-white/22 truncate">{t.reason.slice(0, 48)}…</p>
              }
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Performance ────────────────────────────────────────────────────────────────

function PerformanceSection() {
  const [fps, setFps] = useState(0);
  const [memMB, setMemMB] = useState<number | null>(null);
  const windowCount = useOSStore((s) => s.windows.length);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const frames = useRef(0);

  useEffect(() => {
    let alive = true;
    const tick = (now: number) => {
      if (!alive) return;
      frames.current++;
      if (now - lastRef.current >= 1000) {
        setFps(frames.current);
        frames.current = 0;
        lastRef.current = now;
        const mem = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (mem) setMemMB(Math.round(mem.usedJSHeapSize / 1024 / 1024));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  const fpsColor = fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : fps > 0 ? 'text-rose-400' : 'text-white/30';

  const metrics = [
    { label: 'FPS', value: fps > 0 ? `${fps}` : '—', sub: 'requestAnimationFrame', color: fpsColor, live: true },
    { label: 'JS Heap', value: memMB != null ? `${memMB} MB` : 'N/A', sub: 'usedJSHeapSize (Chrome only)', color: 'text-sky-400', live: memMB != null },
    { label: 'Open Windows', value: `${windowCount}`, sub: 'active window states', color: 'text-violet-400', live: true },
    { label: 'Bundle (min)', value: '559 KB', sub: '175 KB gzipped', color: 'text-amber-400', live: false },
    { label: 'AI Latency', value: '~300ms', sub: 'median Groq inference', color: 'text-orange-400', live: false },
    { label: 'TTI', value: '< 1.2s', sub: 'time-to-interactive', color: 'text-green-400', live: false },
  ];

  const chunks = [
    { label: 'AppLayout (main)', kb: 559, color: 'bg-violet-500' },
    { label: 'PDF Viewer', kb: 430, color: 'bg-sky-500' },
    { label: 'Analytics Dashboard', kb: 368, color: 'bg-amber-500' },
    { label: 'Architecture Viewer', kb: 169, color: 'bg-emerald-500' },
  ];

  return (
    <div>
      <SectionHeader title="Performance" subtitle="Live browser metrics + build stats" />
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] uppercase tracking-wider text-white/25">{m.label}</p>
                {m.live && <span className="flex items-center gap-1 text-[8px] text-emerald-400"><BsCircleFill size={4} className="animate-pulse" />LIVE</span>}
              </div>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[9px] text-white/25 mt-0.5">{m.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card>
        <p className="text-[9px] uppercase tracking-wider text-white/25 mb-3">Largest Bundle Chunks</p>
        <div className="space-y-2.5">
          {chunks.map(c => (
            <div key={c.label}>
              <div className="flex justify-between text-[9px] text-white/40 mb-1">
                <span>{c.label}</span>
                <span className="font-mono">{c.kb} KB</span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(c.kb / 559 * 100)}%` }}
                  transition={{ duration: 0.9, delay: 0.2 }} className={`h-full rounded-full ${c.color}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Security ───────────────────────────────────────────────────────────────────

function SecuritySection() {
  const steps = [
    { icon: '🔒', label: 'Lock Screen Guard', desc: 'All content gated behind session unlock. Persisted via sessionStorage.', c: 'border-white/15 bg-white/5' },
    { icon: '🪪', label: 'Google / GitHub OAuth', desc: 'Required before Copilot access. Token exchange happens server-side only.', c: 'border-sky-500/30 bg-sky-500/10' },
    { icon: '🛡️', label: 'Server-Side Token Validation', desc: 'API route validates token with provider. Browser never touches OAuth secrets.', c: 'border-violet-500/30 bg-violet-500/10' },
    { icon: '🔑', label: 'Deterministic User Hash', desc: 'HMAC(APP_SECRET + user_id) creates an anonymous identifier for rate limiting. No PII stored.', c: 'border-amber-500/30 bg-amber-500/10' },
    { icon: '⏱️', label: 'Per-User Rate Limit: 30 req/day', desc: 'Enforced server-side per hash. Prevents abuse without tracking personal data.', c: 'border-orange-500/30 bg-orange-500/10' },
    { icon: '🚦', label: 'Global Daily Cap: 50 API calls', desc: 'Hard server ceiling on total Groq calls per day — cost protection regardless of users.', c: 'border-rose-500/30 bg-rose-500/10' },
    { icon: '🏰', label: 'Backend-Only Secrets', desc: 'GROQ_API_KEY, SARVAM_API_KEY, DATABASE_URL live in Vercel env vars — never bundled.', c: 'border-emerald-500/30 bg-emerald-500/10' },
  ];
  return (
    <div>
      <SectionHeader title="Security" subtitle="Auth flow, rate limiting, and secret protection" />
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center">
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}
              className={`w-full rounded-xl border p-3 ${s.c}`}>
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">{s.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{s.label}</p>
                  <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </motion.div>
            {i < steps.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Cost Optimization ───────────────────────────────────────────────────────

function CostOptimizationSection() {
  const bars = [
    { label: 'Offline NLP', pct: 70, cost: '$0.00 / query', color: 'bg-emerald-500/50', tc: 'text-emerald-400' },
    { label: 'Groq API fallback', pct: 30, cost: '~$0.0002 / query', color: 'bg-orange-500/50', tc: 'text-orange-400' },
  ];
  const stats = [
    { label: 'Max daily cost', value: '< $0.01', sub: '50 calls × $0.0002', c: 'text-emerald-400' },
    { label: 'Model', value: 'llama-3.3-70b', sub: '$0.59 / 1M tokens (Groq)', c: 'text-orange-300' },
    { label: 'Avg tokens / query', value: '~300', sub: 'input + output combined', c: 'text-sky-400' },
    { label: 'Daily API cap', value: '50 calls', sub: 'hard server limit', c: 'text-amber-400' },
  ];
  const offline = [
    'Navigation: open/close/show/launch commands',
    'Greetings and identity questions',
    'App intents with known action mapping',
    'Simple info queries from local config data',
  ];
  return (
    <div>
      <SectionHeader title="AI Cost Optimization" subtitle="Offline-first NLP with smart Groq fallback" />
      <Card className="mb-4">
        <p className="text-[9px] uppercase tracking-wider text-white/25 mb-4">Query Traffic Split</p>
        <div className="space-y-3">
          {bars.map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className={b.tc}>{b.label}</span>
                <span className="text-white/40">{b.pct}% · {b.cost}</span>
              </div>
              <div className="h-5 bg-white/8 rounded-lg overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${b.pct}%` }}
                  transition={{ duration: 1, delay: 0.2 }} className={`h-full rounded-lg ${b.color}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {stats.map(m => (
          <Card key={m.label}>
            <p className="text-[9px] uppercase tracking-wider text-white/25">{m.label}</p>
            <p className={`text-sm font-bold mt-1 ${m.c}`}>{m.value}</p>
            <p className="text-[9px] text-white/25 mt-0.5">{m.sub}</p>
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2.5">Offline NLP Covers</p>
        <div className="space-y-1.5">
          {offline.map(o => (
            <div key={o} className="flex items-center gap-2">
              <BsCheck2 size={10} className="text-emerald-400 shrink-0" />
              <span className="text-[10px] text-white/55">{o}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Version History ────────────────────────────────────────────────────────────

const VERSIONS = [
  { v: 'v1.1', date: 'Jul 2026', label: 'Developer Settings', bg: 'bg-violet-500', tc: 'text-violet-400', current: true,
    features: ['Developer Settings app (this!)', 'Sarvam TTS tour narration', 'Camera watermark with favicon', 'Centered boot copilot window', 'Custom SVG desktop icons'] },
  { v: 'v1.0', date: 'Jun 2026', label: 'Guided Tour', bg: 'bg-indigo-500', tc: 'text-indigo-400',
    features: ['9-step automated recruiter tour', 'Virtual cursor with spring physics', 'TourNotification popup (10s delay)', 'Final CTA overlay (email + resume)'] },
  { v: 'v0.9', date: 'May 2026', label: 'Security Layer', bg: 'bg-sky-500', tc: 'text-sky-400',
    features: ['Google + GitHub OAuth gate', 'Server-side rate limiting', 'Daily API cap enforcement', 'Deterministic HMAC user hashing'] },
  { v: 'v0.8', date: 'Apr 2026', label: 'AI Copilot', bg: 'bg-emerald-500', tc: 'text-emerald-400',
    features: ['Offline NLP parser', 'Groq llama-3.3-70b fallback', 'Confidence scoring system', 'OS action execution pipeline'] },
  { v: 'v0.6', date: 'Feb 2026', label: 'App Suite', bg: 'bg-amber-500', tc: 'text-amber-400',
    features: ['Photos gallery + lightbox', 'HackathonRush pixel game', 'Founder HQ + Research Center', 'Analytics Dashboard'] },
  { v: 'v0.3', date: 'Nov 2025', label: 'OS Foundation', bg: 'bg-orange-600', tc: 'text-orange-400',
    features: ['Window manager + drag/resize', 'Dock 2.0 with bounce animation', 'Boot sequence animation', 'Spotlight search', 'MacToolbar + keyboard shortcuts'] },
  { v: 'v0.1', date: 'Sep 2025', label: 'Initial Concept', bg: 'bg-white/30', tc: 'text-white/50',
    features: ['macOS-style terminal portfolio', 'Basic window system', 'Astro 5 + React 19 setup'] },
];

function VersionHistorySection() {
  const [expanded, setExpanded] = useState<string | null>('v1.1');
  return (
    <div>
      <SectionHeader title="Version History" subtitle="Major releases and milestones" />
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />
        <div className="space-y-1 pl-2">
          {VERSIONS.map((v, i) => (
            <motion.div key={v.v} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}>
              <button onClick={() => setExpanded(expanded === v.v ? null : v.v)} className="w-full text-left">
                <div className="flex items-center gap-2.5 py-1 px-1">
                  <div className={`w-3 h-3 rounded-full shrink-0 ml-1.5 ${v.bg} ${v.current ? 'ring-2 ring-white/25 ring-offset-1 ring-offset-[#1c1c1e]' : ''}`} />
                  <span className="font-mono text-xs font-bold text-white/75">{v.v}</span>
                  <span className="text-xs text-white/50">{v.label}</span>
                  {v.current && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/25 text-violet-300">current</span>}
                  <span className="text-[9px] text-white/20 ml-auto">{v.date}</span>
                  {expanded === v.v ? <BsChevronDown size={8} className="text-white/25" /> : <BsChevronRight size={8} className="text-white/25" />}
                </div>
              </button>
              <AnimatePresence>
                {expanded === v.v && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="ml-8 mb-1 p-2.5 rounded-lg bg-white/5 border border-white/8">
                      <div className="space-y-1">
                        {v.features.map(f => (
                          <div key={f} className="flex items-center gap-1.5">
                            <BsCheck2 size={9} className={`shrink-0 ${v.tc}`} />
                            <span className="text-[10px] text-white/55">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DeveloperSettings({ payload }: AppWindowProps) {
  const [active, setActive] = useState<SectionId>((payload?.section as SectionId) ?? 'architecture');
  const [search, setSearch] = useState('');

  const filtered = SECTIONS.filter(s =>
    search === '' || s.label.toLowerCase().includes(search.toLowerCase())
  );

  const renderSection = (id: SectionId) => {
    switch (id) {
      case 'architecture':      return <ArchitectureSection />;
      case 'ai-pipeline':       return <AIPipelineSection />;
      case 'state-management':  return <StateManagementSection />;
      case 'window-manager':    return <WindowManagerSection />;
      case 'folder-structure':  return <FolderStructureSection />;
      case 'tech-stack':        return <TechStackSection />;
      case 'performance':       return <PerformanceSection />;
      case 'security':          return <SecuritySection />;
      case 'cost-optimization': return <CostOptimizationSection />;
      case 'version-history':   return <VersionHistorySection />;
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#1c1c1e] text-white">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-white/8 flex flex-col bg-[#242426]">
        <div className="p-3 pb-1.5">
          <div className="flex items-center gap-2 bg-white/8 rounded-lg px-2.5 py-1.5">
            <BsSearch size={10} className="text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[11px] text-white/80 placeholder-white/25 outline-none w-full"
            />
          </div>
        </div>
        <div className="px-3 pb-2 pt-1">
          <p className="text-[9px] uppercase tracking-widest text-white/20 font-semibold">Developer Mode</p>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-3 space-y-0.5">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                active === s.id
                  ? 'bg-white/14 text-white font-medium'
                  : 'text-white/50 hover:bg-white/7 hover:text-white/75'
              }`}
            >
              <s.Icon size={12} className={active === s.id ? 'text-white' : 'text-white/35'} />
              {s.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-[10px] text-white/20 px-2.5 py-4 italic">No results for "{search}"</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="p-6"
          >
            {renderSection(active)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
