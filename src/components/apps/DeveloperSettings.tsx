import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BsSearch, BsCpu, BsDiagram3, BsDatabase, BsLayersHalf, BsFolderFill,
  BsStack, BsGraphUp, BsShieldLock, BsLightningCharge, BsClockHistory,
  BsArrowDown, BsChevronRight, BsChevronDown, BsCircleFill, BsCheck2,
} from 'react-icons/bs';
import { useOSStore } from '../../stores/osStore';
import type { AppWindowProps } from '../../os/types';

type SectionId =
  | 'architecture' | 'ai-pipeline' | 'state-management' | 'window-manager'
  | 'folder-structure' | 'tech-stack' | 'performance' | 'security'
  | 'cost-optimization' | 'version-history';

const SECTIONS: {
  id: SectionId; label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
}[] = [
  { id: 'architecture',      label: 'Architecture',         Icon: BsDiagram3,       iconBg: 'bg-blue-600' },
  { id: 'ai-pipeline',       label: 'AI Pipeline',          Icon: BsCpu,            iconBg: 'bg-orange-500' },
  { id: 'state-management',  label: 'State Management',     Icon: BsDatabase,       iconBg: 'bg-green-600' },
  { id: 'window-manager',    label: 'Window Manager',       Icon: BsLayersHalf,     iconBg: 'bg-purple-600' },
  { id: 'folder-structure',  label: 'Folder Structure',     Icon: BsFolderFill,     iconBg: 'bg-yellow-500' },
  { id: 'tech-stack',        label: 'Tech Stack',           Icon: BsStack,          iconBg: 'bg-indigo-500' },
  { id: 'performance',       label: 'Performance',          Icon: BsGraphUp,        iconBg: 'bg-red-500' },
  { id: 'security',          label: 'Security',             Icon: BsShieldLock,     iconBg: 'bg-teal-600' },
  { id: 'cost-optimization', label: 'AI Cost Optimization', Icon: BsLightningCharge,iconBg: 'bg-amber-500' },
  { id: 'version-history',   label: 'Version History',      Icon: BsClockHistory,   iconBg: 'bg-slate-500' },
];

// ── macOS-style primitives ────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[17px] font-semibold text-white tracking-tight">{title}</h1>
      <p className="text-[12px] text-[rgba(235,235,245,0.45)] mt-0.5">{subtitle}</p>
    </div>
  );
}

/** macOS grouped-table section wrapper. */
function Group({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {label && (
        <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.4)] uppercase tracking-wider mb-1.5 px-1">{label}</p>
      )}
      <div className="rounded-xl bg-[#2C2C2E] overflow-hidden divide-y divide-white/[0.06]">
        {children}
      </div>
    </div>
  );
}

/** Single row inside a Group. */
function Row({
  label, sub, value, badge, mono = false, children,
}: {
  label: string; sub?: string; value?: string;
  badge?: { text: string; color: string };
  mono?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-[11px]">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white leading-snug">{label}</p>
        {sub && <p className="text-[11px] text-[rgba(235,235,245,0.38)] mt-0.5 leading-snug">{sub}</p>}
      </div>
      {badge && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.color}`}>{badge.text}</span>
      )}
      {value && (
        <span className={`text-[13px] text-[rgba(235,235,245,0.45)] shrink-0 text-right ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</span>
      )}
      {children}
    </div>
  );
}

/** Node in a flow diagram. */
function FlowNode({ title, sub, tint }: { title: string; sub: string; tint?: string }) {
  return (
    <div className={`w-full rounded-xl px-4 py-3 border ${tint ?? 'bg-[#3A3A3C] border-white/[0.08]'}`}>
      <p className="text-[13px] font-medium text-white">{title}</p>
      <p className="text-[11px] text-[rgba(235,235,245,0.4)] mt-0.5">{sub}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex flex-col items-center my-[5px]">
      <div className="w-px h-3 bg-white/[0.12]" />
      <BsArrowDown size={8} className="text-white/20" />
    </div>
  );
}

// ── Architecture ───────────────────────────────────────────────────────────────

function ArchitectureSection() {
  return (
    <div>
      <SectionHeader title="Architecture" subtitle="System design and infrastructure layers" />

      <Group label="Overview">
        <Row label="Framework"   value="Astro 5" />
        <Row label="Rendering"   value="Islands (SSR + React 19)" />
        <Row label="Runtime"     value="Node.js 22" />
        <Row label="Deployment"  value="Vercel Edge Network" />
        <Row label="Database"    value="Neon Postgres (serverless)" />
      </Group>

      <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.4)] uppercase tracking-wider mb-1.5 px-1">System Layers</p>
      <div className="rounded-xl bg-[#2C2C2E] p-4 mb-5">
        <div className="flex flex-col items-center">
          {[
            { label: 'Browser Layer',      sub: 'React 19 Islands · Framer Motion · Zustand',     dot: 'bg-blue-400' },
            { label: 'Astro 5 SSR',        sub: 'API Routes · Middleware · Environment secrets',   dot: 'bg-violet-400' },
            { label: 'Vercel Edge Network',sub: 'CDN · Serverless Functions · 40 regions',         dot: 'bg-slate-400' },
          ].map((layer, i, arr) => (
            <div key={layer.label} className="w-full flex flex-col items-center">
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09 }}
                className="w-full flex items-center gap-3 bg-[#3A3A3C] rounded-xl px-4 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${layer.dot}`} />
                <div>
                  <p className="text-[13px] font-medium text-white">{layer.label}</p>
                  <p className="text-[11px] text-[rgba(235,235,245,0.38)] mt-0.5 font-mono">{layer.sub}</p>
                </div>
              </motion.div>
              {i < arr.length - 1 && <Connector />}
            </div>
          ))}
          <Connector />
          <div className="w-full grid grid-cols-3 gap-2">
            {[
              { label: 'Groq API',      sub: 'llama-3.3-70b',  dot: 'bg-orange-400' },
              { label: 'Neon Postgres', sub: 'Lead + analytics',dot: 'bg-green-400' },
              { label: 'Sarvam TTS',    sub: 'Tour narration',  dot: 'bg-sky-400' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07 }}
                className="bg-[#3A3A3C] rounded-xl px-3 py-2.5">
                <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${s.dot}`} />
                <p className="text-[12px] font-medium text-white inline">{s.label}</p>
                <p className="text-[10px] text-[rgba(235,235,245,0.35)] mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Group label="Data Flow">
        <Row label="Request path" value="Browser → Astro API → Vercel → External" />
        <Row label="Secret protection" value="Env vars only — never bundled" />
        <Row label="Client bundle" value="Zero server secrets" />
      </Group>
    </div>
  );
}

// ── AI Pipeline ────────────────────────────────────────────────────────────────

function AIPipelineSection() {
  return (
    <div>
      <SectionHeader title="AI Pipeline" subtitle="Every query from natural language to OS action" />

      <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.4)] uppercase tracking-wider mb-1.5 px-1">Query Flow</p>
      <div className="rounded-xl bg-[#2C2C2E] p-4 mb-5">
        <div className="flex flex-col items-center">
          {[
            { title: 'User Input', sub: 'Natural language query in the Copilot' },
            { title: 'Offline NLP Parser', sub: 'Regex · keyword extraction · intent mapping' },
            { title: 'Confidence Scoring', sub: '0.0 – 1.0 score based on pattern match strength' },
          ].map((step, i) => (
            <div key={step.title} className="w-full flex flex-col items-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="w-full">
                <FlowNode title={step.title} sub={step.sub} />
              </motion.div>
              <Connector />
            </div>
          ))}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="w-full grid grid-cols-2 gap-2.5 mb-1">
            <div className="rounded-xl bg-[#1A3028] border border-green-500/20 px-4 py-3">
              <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wide mb-1">Score ≥ 0.7</p>
              <p className="text-[13px] font-medium text-white">Local Execution</p>
              <p className="text-[11px] text-[rgba(235,235,245,0.38)] mt-0.5">$0.00 · &lt;5ms</p>
            </div>
            <div className="rounded-xl bg-[#2C1F10] border border-orange-500/20 px-4 py-3">
              <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide mb-1">Score &lt; 0.7</p>
              <p className="text-[13px] font-medium text-white">Groq API</p>
              <p className="text-[11px] text-[rgba(235,235,245,0.38)] mt-0.5">llama-3.3-70b · ~300ms</p>
            </div>
          </motion.div>

          {[
            { title: 'Parse OS Actions', sub: 'openWindow · closeWindow · navigate · showMedia · message' },
            { title: 'Execute in UI', sub: 'Zustand dispatch · React re-render · Framer Motion transition' },
          ].map((step, i, arr) => (
            <div key={step.title} className="w-full flex flex-col items-center">
              <Connector />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 + i * 0.1 }} className="w-full">
                <FlowNode title={step.title} sub={step.sub} />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <Group label="Configuration">
        <Row label="LLM Provider"         value="Groq SDK" />
        <Row label="Model"                value="llama-3.3-70b" />
        <Row label="Confidence Threshold" value="0.7" />
        <Row label="Offline Coverage"     value="~70% of queries" />
        <Row label="Fallback Latency"     value="~300ms median" />
      </Group>
    </div>
  );
}

// ── State Management ───────────────────────────────────────────────────────────

function StateManagementSection() {
  const [open, setOpen] = useState<string | null>('osStore');

  const stores = [
    {
      name: 'osStore', file: 'src/stores/osStore.ts',
      state: [
        'windows: WindowState[]', 'booted: boolean', 'kernelPanic: boolean',
        'retroMode: boolean', 'weather: WeatherState', 'customWallpaper: string | null',
      ],
      actions: [
        'openWindow()', 'closeWindow()', 'focusWindow()', 'minimizeWindow()',
        'updateWindowPosition()', 'closeAllWindows()', 'executeCopilotActions()',
      ],
    },
    {
      name: 'tourStore', file: 'src/stores/tourStore.ts',
      state: [
        'running: boolean', 'step: number', 'totalSteps: number',
        'muted: boolean', 'captionTitle: string', 'captionBody: string', 'showFinal: boolean',
      ],
      actions: ['startTour()', 'skipTour()', 'toggleMute()', '_advance(step, title, body)', '_finish()'],
    },
  ];

  return (
    <div>
      <SectionHeader title="State Management" subtitle="Zustand stores powering the AdityaOS runtime" />

      <Group label="Stores">
        {stores.map((store) => (
          <div key={store.name}>
            <button onClick={() => setOpen(open === store.name ? null : store.name)}
              className="w-full flex items-center gap-3 px-4 py-[11px] text-left hover:bg-white/[0.04] transition-colors">
              <div className="flex-1">
                <p className="text-[13px] text-white font-mono">{store.name}</p>
                <p className="text-[11px] text-[rgba(235,235,245,0.38)] mt-0.5 font-mono">{store.file}</p>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {open === store.name
                  ? <motion.span key="d" initial={{ rotate: 0 }} animate={{ rotate: 0 }}><BsChevronDown size={11} className="text-white/30" /></motion.span>
                  : <motion.span key="r" initial={{ rotate: 0 }} animate={{ rotate: 0 }}><BsChevronRight size={11} className="text-white/30" /></motion.span>
                }
              </AnimatePresence>
            </button>
            <AnimatePresence>
              {open === store.name && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/[0.06]">
                  <div className="px-4 py-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[rgba(235,235,245,0.3)] uppercase tracking-wider mb-2">State</p>
                      <div className="space-y-1">
                        {store.state.map(s => <p key={s} className="text-[11px] font-mono text-[rgba(235,235,245,0.55)]">{s}</p>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-[rgba(235,235,245,0.3)] uppercase tracking-wider mb-2">Actions</p>
                      <div className="space-y-1">
                        {store.actions.map(a => <p key={a} className="text-[11px] font-mono text-[rgba(52,199,89,0.8)]">{a}</p>)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </Group>

      <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.4)] uppercase tracking-wider mb-1.5 px-1">Window Lifecycle</p>
      <div className="rounded-xl bg-[#2C2C2E] p-4 mb-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: 'CLOSED',   c: 'bg-white/10 text-white/40' },
            { label: 'OPEN',     c: 'bg-[#1C3A5C] text-[#4FC3F7]' },
            { label: 'FOCUSED',  c: 'bg-[#1A3028] text-[#34C759]' },
            { label: 'MINIMIZED',c: 'bg-[#2C2010] text-[#FF9F0A]' },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-semibold px-2 py-1 rounded-lg ${s.c}`}>{s.label}</span>
              {i < arr.length - 1 && <span className="text-white/15 text-xs">→</span>}
            </div>
          ))}
          <span className="text-white/15 text-xs">→</span>
          <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg bg-white/10 text-white/40">CLOSED</span>
        </div>
        <p className="text-[11px] text-[rgba(235,235,245,0.3)] mt-3 leading-relaxed">
          <code className="text-[rgba(235,235,245,0.5)]">getState()</code> enables imperative dispatch outside React — tour script and copilot actions use this without hooks.
        </p>
      </div>
    </div>
  );
}

// ── Window Manager ─────────────────────────────────────────────────────────────

function WindowManagerSection() {
  const windows = useOSStore((s) => s.windows);

  return (
    <div>
      <SectionHeader title="Window Manager" subtitle="Z-index system and live window states" />

      <Group label={`Live Windows (${windows.length})`}>
        {windows.length === 0
          ? <div className="px-4 py-[11px]"><p className="text-[13px] text-[rgba(235,235,245,0.3)] italic">No windows open</p></div>
          : windows.map((w) => (
              <Row key={w.id} label={w.title} sub={`z: ${w.zIndex}`}
                badge={w.minimized ? { text: 'minimized', color: 'bg-[#2C1F10] text-[#FF9F0A]' } : w.focused ? { text: 'focused', color: 'bg-[#1A3028] text-[#34C759]' } : { text: 'background', color: 'bg-white/8 text-white/35' }} />
            ))
        }
      </Group>

      <Group label="Z-Index Layers">
        {[
          { label: 'Tour UI',            sub: 'VirtualCursor, Captions, Skip',        value: '9970–9999' },
          { label: 'Modals & Overlays',  sub: 'Spotlight, Shortcuts, CareerControl',  value: '9000–9960' },
          { label: 'Dock & Menu Bar',    sub: 'Always above windows',                 value: '200–300' },
          { label: 'App Windows',        sub: 'Dynamic promotion on focus',           value: '100–199' },
          { label: 'Desktop Widgets',    sub: 'Profile widget, wallpaper',            value: '1–10' },
        ].map((l) => <Row key={l.label} label={l.label} sub={l.sub} value={l.value} mono />)}
      </Group>

      <Group label="Features">
        {['Drag to reposition', 'Resize via corner handle', 'Minimize to dock badge', 'Focus → z-index promotion', 'Singleton enforcement per appId', 'WindowPayload pass-through'].map((f) => (
          <div key={f} className="flex items-center gap-3 px-4 py-2.5">
            <BsCheck2 size={11} className="text-[#34C759] shrink-0" />
            <span className="text-[13px] text-[rgba(235,235,245,0.7)]">{f}</span>
          </div>
        ))}
      </Group>
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
      <div className="flex items-start gap-1.5 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer py-0.5 px-1"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => hasChildren && setOpen(!open)}>
        <span className="mt-[3px] w-3 shrink-0">
          {hasChildren ? (open ? <BsChevronDown size={8} className="text-white/30" /> : <BsChevronRight size={8} className="text-white/30" />) : null}
        </span>
        <span className={`text-[12px] font-mono leading-snug ${node.color ?? 'text-[rgba(235,235,245,0.6)]'}`}>{node.name}</span>
        {node.desc && !hasChildren && <span className="text-[10px] text-[rgba(235,235,245,0.22)] mt-[3px] ml-2 leading-snug">{node.desc}</span>}
      </div>
      {hasChildren && open && node.children!.map((c, i) => <TreeItem key={i} node={c} depth={depth + 1} />)}
    </div>
  );
}

const TREE: TreeNode = {
  name: 'src/', color: 'text-white/85',
  children: [
    { name: 'components/', children: [
      { name: 'apps/',    color: 'text-[#4FC3F7]', desc: '16 app components' },
      { name: 'global/',  color: 'text-[#34C759]', desc: 'MacToolbar, Spotlight, Dock, Notifications' },
      { name: 'os/',      color: 'text-[#BF5AF2]', desc: 'WindowManager, VirtualCursor, GuidedTour, Boot' },
    ]},
    { name: 'config/', color: 'text-[#FF9F0A]', desc: 'Content data, userConfig, app config' },
    { name: 'layouts/', desc: 'AppLayout.tsx — desktop orchestrator + boot' },
    { name: 'lib/', desc: 'analytics.ts · easterEggs.ts · zIndex.ts' },
    { name: 'os/', children: [
      { name: 'types.ts',          color: 'text-[#FF9F0A]', desc: 'AppId, WindowState, WindowPayload' },
      { name: 'appRegistry.tsx',   color: 'text-[#FF9F0A]', desc: '20+ app definitions' },
      { name: 'tourScript.ts',     color: 'text-[#FF9F0A]', desc: '9-step automated recruiter tour' },
      { name: 'WindowManager.tsx', color: 'text-[#FF9F0A]', desc: 'Renders all open windows' },
    ]},
    { name: 'pages/', children: [
      { name: 'api/', color: 'text-[#FF453A]', children: [
        { name: 'chat.ts',      color: 'text-[#FF6B60]', desc: 'Groq copilot proxy + auth + rate limit' },
        { name: 'tts.ts',      color: 'text-[#FF6B60]', desc: 'Sarvam TTS proxy — key server-only' },
        { name: 'auth.ts',     color: 'text-[#FF6B60]', desc: 'OAuth token exchange' },
        { name: 'analytics.ts',color: 'text-[#FF6B60]', desc: 'Neon Postgres event logging' },
      ]},
      { name: 'index.astro', color: 'text-[#FF9F0A]', desc: 'Entry point — SSR page serving React desktop' },
    ]},
    { name: 'stores/', children: [
      { name: 'osStore.ts',  color: 'text-[#34C759]', desc: 'Windows, booted, weather, wallpaper' },
      { name: 'tourStore.ts',color: 'text-[#34C759]', desc: 'Tour running/step/muted/captions' },
    ]},
    { name: 'styles/', desc: 'Global CSS, Tailwind utilities' },
  ],
};

function FolderStructureSection() {
  return (
    <div>
      <SectionHeader title="Folder Structure" subtitle="Hover files for descriptions — click folders to expand" />
      <div className="rounded-xl bg-[#2C2C2E] p-4 mb-5">
        <TreeItem node={TREE} />
      </div>
      <Group label="Summary">
        <Row label="App Components"  value="16"      sub="Camera, FounderHQ, Photos, HackathonRush…" />
        <Row label="API Routes"      value="6"       sub="chat, tts, auth, analytics, leads, cron" />
        <Row label="Zustand Stores"  value="2"       sub="osStore + tourStore" />
        <Row label="Total Source"    value="~8,000 lines" sub="TypeScript + TSX" />
      </Group>
    </div>
  );
}

// ── Tech Stack ─────────────────────────────────────────────────────────────────

const TECH = [
  { name: 'Astro 5',       version: '5.x',       emoji: '🚀', reason: 'Zero-JS islands — only hydrates components that need interactivity. Static HTML for everything else.' },
  { name: 'React 19',      version: '19.x',      emoji: '⚛️', reason: 'Concurrent features, stable use() hook. Island architecture is a natural fit for the desktop pattern.' },
  { name: 'TypeScript',    version: '5.7',       emoji: '🔷', reason: 'AppId union type prevents invalid window opens at compile time. WindowPayload index enables flexible payloads.' },
  { name: 'Tailwind CSS',  version: '4.x',       emoji: '🎨', reason: 'Zero dead CSS in production. Design tokens via CSS variables, utility-first theming.' },
  { name: 'Framer Motion', version: '12.x',      emoji: '✨', reason: 'Spring physics for the virtual cursor, window drag, boot animation, and all transitions.' },
  { name: 'Zustand 5',    version: '5.x',       emoji: '🐻', reason: 'getState() outside React — tour script and copilot dispatch without hooks or context.' },
  { name: 'Groq SDK',     version: '0.x',       emoji: '🤖', reason: 'llama-3.3-70b at ~300ms. 10× cheaper than GPT-4 for equivalent conversational quality.' },
  { name: 'Neon Postgres', version: 'serverless',emoji: '🗄️', reason: 'Serverless Postgres with no cold starts. Lead capture, analytics events, branching for dev environments.' },
  { name: 'Vercel',       version: '—',         emoji: '▲',  reason: 'Zero-config Astro SSR, preview URLs per commit, 40-region CDN, instant rollbacks.' },
  { name: 'Vite',         version: '6.x',       emoji: '⚡', reason: 'Sub-second HMR, optimized production bundles with tree-shaking, PWA plugin.' },
];

function TechStackSection() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div>
      <SectionHeader title="Tech Stack" subtitle="Click any row to see the reason it was chosen" />
      <Group label="Libraries & Services">
        {TECH.map((t, i, arr) => (
          <div key={t.name}>
            <button onClick={() => setSelected(selected === t.name ? null : t.name)}
              className="w-full flex items-center gap-3 px-4 py-[11px] text-left hover:bg-white/[0.04] transition-colors">
              <span className="text-[18px] leading-none w-7 text-center">{t.emoji}</span>
              <div className="flex-1">
                <p className="text-[13px] text-white">{t.name}</p>
                {selected === t.name && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}
                    className="text-[11px] text-[rgba(235,235,245,0.45)] mt-1 leading-relaxed">
                    {t.reason}
                  </motion.p>
                )}
              </div>
              <span className="text-[11px] font-mono text-[rgba(235,235,245,0.3)] shrink-0">{t.version}</span>
              {selected === t.name
                ? <BsChevronDown size={10} className="text-white/25 shrink-0" />
                : <BsChevronRight size={10} className="text-white/25 shrink-0" />}
            </button>
          </div>
        ))}
      </Group>
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
        setFps(frames.current); frames.current = 0; lastRef.current = now;
        const mem = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (mem) setMemMB(Math.round(mem.usedJSHeapSize / 1024 / 1024));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  const fpsColor = fps >= 55 ? 'text-[#34C759]' : fps >= 30 ? 'text-[#FF9F0A]' : fps > 0 ? 'text-[#FF453A]' : 'text-white/30';

  return (
    <div>
      <SectionHeader title="Performance" subtitle="Live browser metrics and build statistics" />

      <Group label="Live Metrics">
        <div className="flex items-center gap-3 px-4 py-[11px]">
          <p className="flex-1 text-[13px] text-white">Frame Rate</p>
          <span className="flex items-center gap-1.5 text-[10px] text-[#34C759]"><BsCircleFill size={5} className="animate-pulse" />LIVE</span>
          <span className={`text-[13px] font-mono ml-2 ${fpsColor}`}>{fps > 0 ? `${fps} fps` : '—'}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-[11px]">
          <p className="flex-1 text-[13px] text-white">JS Heap</p>
          {memMB != null && <span className="flex items-center gap-1.5 text-[10px] text-[#34C759]"><BsCircleFill size={5} className="animate-pulse" />LIVE</span>}
          <span className="text-[13px] font-mono ml-2 text-[rgba(235,235,245,0.45)]">{memMB != null ? `${memMB} MB` : 'N/A (Firefox)'}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-[11px]">
          <p className="flex-1 text-[13px] text-white">Open Windows</p>
          <span className="flex items-center gap-1.5 text-[10px] text-[#34C759]"><BsCircleFill size={5} className="animate-pulse" />LIVE</span>
          <span className="text-[13px] font-mono ml-2 text-[rgba(235,235,245,0.45)]">{windowCount}</span>
        </div>
      </Group>

      <Group label="Build Stats">
        <Row label="Bundle (minified)" value="559 KB" />
        <Row label="Bundle (gzipped)"  value="175 KB" />
        <Row label="AI Response Time"  value="~300ms median" />
        <Row label="Time-to-Interactive" value="< 1.2s" />
        <Row label="Build Time"        value="~25s (Vercel)" />
      </Group>

      <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.4)] uppercase tracking-wider mb-1.5 px-1">Largest Chunks</p>
      <div className="rounded-xl bg-[#2C2C2E] p-4">
        <div className="space-y-3">
          {[
            { label: 'AppLayout (main)',      kb: 559, color: 'bg-[#BF5AF2]' },
            { label: 'PDF Viewer',            kb: 430, color: 'bg-[#0A84FF]' },
            { label: 'Analytics Dashboard',   kb: 368, color: 'bg-[#FF9F0A]' },
            { label: 'Architecture Viewer',   kb: 169, color: 'bg-[#34C759]' },
          ].map(c => (
            <div key={c.label}>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-[rgba(235,235,245,0.55)]">{c.label}</span>
                <span className="text-[rgba(235,235,245,0.35)] font-mono">{c.kb} KB</span>
              </div>
              <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(c.kb / 559 * 100)}%` }}
                  transition={{ duration: 0.9, delay: 0.15 }} className={`h-full rounded-full ${c.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Security ───────────────────────────────────────────────────────────────────

function SecuritySection() {
  return (
    <div>
      <SectionHeader title="Security" subtitle="Authentication, rate limiting, and secret protection" />

      <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.4)] uppercase tracking-wider mb-1.5 px-1">Auth Flow</p>
      <div className="rounded-xl bg-[#2C2C2E] p-4 mb-5">
        <div className="flex flex-col items-center">
          {[
            { title: 'Lock Screen Guard',         sub: 'All content gated — persisted via sessionStorage' },
            { title: 'Google / GitHub OAuth',     sub: 'Required before Copilot access. Token exchange server-side only.' },
            { title: 'Server-Side Validation',    sub: 'Astro API route validates token. Browser never touches OAuth secrets.' },
            { title: 'Deterministic User Hash',   sub: 'HMAC(APP_SECRET + user_id) → anonymous rate-limit identifier. No PII stored.' },
            { title: 'Rate Limit: 30 req / day', sub: 'Per-user hash enforced server-side. Blocks abuse without tracking.' },
            { title: 'Global Cap: 50 API calls', sub: 'Hard ceiling on total Groq calls per day — cost protection.' },
          ].map((step, i, arr) => (
            <div key={step.title} className="w-full flex flex-col items-center">
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="w-full">
                <FlowNode title={step.title} sub={step.sub} />
              </motion.div>
              {i < arr.length - 1 && <Connector />}
            </div>
          ))}
        </div>
      </div>

      <Group label="Secret Protection">
        <Row label="GROQ_API_KEY"    sub="LLM inference key"         badge={{ text: 'Server only', color: 'bg-[#1A3028] text-[#34C759]' }} />
        <Row label="SARVAM_API_KEY" sub="TTS synthesis key"          badge={{ text: 'Server only', color: 'bg-[#1A3028] text-[#34C759]' }} />
        <Row label="DATABASE_URL"   sub="Neon Postgres connection"   badge={{ text: 'Server only', color: 'bg-[#1A3028] text-[#34C759]' }} />
        <Row label="APP_SECRET"     sub="HMAC signing key"           badge={{ text: 'Server only', color: 'bg-[#1A3028] text-[#34C759]' }} />
      </Group>
    </div>
  );
}

// ── AI Cost Optimization ───────────────────────────────────────────────────────

function CostOptimizationSection() {
  return (
    <div>
      <SectionHeader title="AI Cost Optimization" subtitle="Offline-first NLP with smart Groq fallback" />

      <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.4)] uppercase tracking-wider mb-1.5 px-1">Query Traffic Split</p>
      <div className="rounded-xl bg-[#2C2C2E] p-4 mb-5">
        <div className="space-y-3.5">
          {[
            { label: 'Offline NLP',    pct: 70, color: 'bg-[#34C759]', tc: 'text-[#34C759]', cost: '$0.00 per query' },
            { label: 'Groq API',       pct: 30, color: 'bg-[#FF9F0A]', tc: 'text-[#FF9F0A]', cost: '~$0.0002 per query' },
          ].map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className={b.tc}>{b.label}</span>
                <span className="text-[rgba(235,235,245,0.4)]">{b.pct}% · {b.cost}</span>
              </div>
              <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${b.pct}%` }}
                  transition={{ duration: 1, delay: 0.2 }} className={`h-full rounded-full ${b.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Group label="Cost Model">
        <Row label="Max Daily Cost"     value="< $0.01"       sub="50 calls × $0.0002" />
        <Row label="Model"              value="llama-3.3-70b" sub="$0.59 / 1M input tokens (Groq)" />
        <Row label="Avg Tokens / Query" value="~300"          sub="input + output combined" />
        <Row label="Daily API Cap"      value="50 calls"      sub="Hard server limit — cost protection" />
      </Group>

      <Group label="Offline NLP Handles">
        {[
          'Navigation commands (open, show, close, launch)',
          'Greetings and identity questions',
          'App intents with known action mapping',
          'Simple info queries answered from local config',
        ].map(o => (
          <div key={o} className="flex items-center gap-3 px-4 py-[11px]">
            <BsCheck2 size={11} className="text-[#34C759] shrink-0" />
            <span className="text-[13px] text-[rgba(235,235,245,0.7)]">{o}</span>
          </div>
        ))}
      </Group>
    </div>
  );
}

// ── Version History ────────────────────────────────────────────────────────────

const VERSIONS = [
  { v: 'v1.1', date: 'Jul 2026', label: 'Developer Settings', dot: 'bg-[#BF5AF2]', current: true,
    features: ['Developer Settings app (this!)', 'Sarvam TTS tour narration', 'Camera watermark with favicon', 'Centered boot copilot', 'Custom SVG desktop icons'] },
  { v: 'v1.0', date: 'Jun 2026', label: 'Guided Tour',        dot: 'bg-[#0A84FF]',
    features: ['9-step automated recruiter tour', 'Virtual cursor with spring physics', 'TourNotification popup (10s delay)', 'Final CTA with email + resume download'] },
  { v: 'v0.9', date: 'May 2026', label: 'Security Layer',     dot: 'bg-[#34C759]',
    features: ['Google + GitHub OAuth gate', 'Server-side rate limiting', 'Daily API cap enforcement', 'Deterministic HMAC user hashing'] },
  { v: 'v0.8', date: 'Apr 2026', label: 'AI Copilot',         dot: 'bg-[#FF9F0A]',
    features: ['Offline NLP parser', 'Groq llama-3.3-70b fallback', 'Confidence scoring (0.7 threshold)', 'OS action execution pipeline'] },
  { v: 'v0.6', date: 'Feb 2026', label: 'App Suite',          dot: 'bg-[#FF453A]',
    features: ['Photos gallery + lightbox', 'HackathonRush pixel game', 'Founder HQ + Research Center', 'Analytics Dashboard'] },
  { v: 'v0.3', date: 'Nov 2025', label: 'OS Foundation',      dot: 'bg-[#FF6B60]',
    features: ['Window manager + drag/resize', 'Dock 2.0 with bounce', 'Boot sequence animation', 'Spotlight search + keyboard shortcuts'] },
  { v: 'v0.1', date: 'Sep 2025', label: 'Initial Concept',    dot: 'bg-white/30',
    features: ['macOS-style terminal portfolio', 'Basic window system', 'Astro 5 + React 19 setup'] },
];

function VersionHistorySection() {
  const [expanded, setExpanded] = useState<string | null>('v1.1');
  return (
    <div>
      <SectionHeader title="Version History" subtitle="Major releases and feature milestones" />
      <Group>
        {VERSIONS.map((v) => (
          <div key={v.v}>
            <button onClick={() => setExpanded(expanded === v.v ? null : v.v)}
              className="w-full flex items-center gap-3 px-4 py-[11px] text-left hover:bg-white/[0.04] transition-colors">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${v.dot} ${v.current ? 'ring-2 ring-white/20 ring-offset-1 ring-offset-[#2C2C2E]' : ''}`} />
              <span className="font-mono text-[12px] font-semibold text-[rgba(235,235,245,0.6)] w-10 shrink-0">{v.v}</span>
              <span className="text-[13px] text-white flex-1">{v.label}</span>
              {v.current && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1C2A3C] text-[#0A84FF]">Current</span>}
              <span className="text-[11px] text-[rgba(235,235,245,0.25)]">{v.date}</span>
              {expanded === v.v ? <BsChevronDown size={10} className="text-white/25" /> : <BsChevronRight size={10} className="text-white/25" />}
            </button>
            <AnimatePresence>
              {expanded === v.v && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[0.06]">
                  <div className="px-4 py-3 space-y-1.5">
                    {v.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <BsCheck2 size={10} className={`shrink-0 ${v.dot.replace('bg-', 'text-')}`} />
                        <span className="text-[12px] text-[rgba(235,235,245,0.55)]">{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </Group>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DeveloperSettings({ payload }: AppWindowProps) {
  const [active, setActive] = useState<SectionId>((payload?.section as SectionId) ?? 'architecture');
  const [search, setSearch] = useState('');

  const filtered = SECTIONS.filter(
    (s) => search === '' || s.label.toLowerCase().includes(search.toLowerCase())
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
    <div className="flex h-full overflow-hidden" style={{ background: '#1C1C1E', color: '#FFFFFF' }}>
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-white/[0.07] flex flex-col" style={{ background: '#242426' }}>
        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 rounded-[8px] px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.09)' }}>
            <BsSearch size={11} className="text-white/30 shrink-0" />
            <input type="text" placeholder="Search" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[12px] placeholder-white/25 outline-none w-full"
              style={{ color: 'rgba(235,235,245,0.85)' }}
            />
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-3">
          {filtered.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-2.5 px-2 py-[7px] rounded-[8px] text-left transition-colors mb-0.5 ${
                active === s.id ? 'bg-white/[0.12]' : 'hover:bg-white/[0.05]'
              }`}>
              <div className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${s.iconBg}`}>
                <s.Icon size={13} className="text-white" />
              </div>
              <span className={`text-[12px] leading-tight ${active === s.id ? 'text-white font-medium' : 'text-[rgba(235,235,245,0.6)]'}`}>
                {s.label}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-[11px] text-white/20 px-2.5 py-4 italic">No results for "{search}"</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="p-6 max-w-[620px]">
            {renderSection(active)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
