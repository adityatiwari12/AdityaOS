import { lazy, Suspense } from 'react';
import { founderHQ } from '../../config/content/index';
import { pitchDeck } from '../../config/apps';

const PdfViewer = lazy(() => import('../global/PdfViewer'));

export default function FounderHQ() {
  return (
    <div className="h-full overflow-y-auto no-scrollbar text-gray-200 p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Founder HQ — Tokenistt</h1>
        <p className="text-gray-400 mt-2">{founderHQ.vision}</p>
        <a
          href="https://www.tokenistt.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm text-orange-400 hover:text-orange-300"
        >
          tokenistt.com ↗
        </a>
      </header>

      <section className="rounded-xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-lg font-semibold mb-2">What is Tokenistt?</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          In simple terms, Tokenistt is a startup I'm building together with my friends{' '}
          <span className="text-orange-300 font-medium">Aryan Singh</span> and{' '}
          <span className="text-orange-300 font-medium">Akshay Khanna</span>. We're building
          the operating system for production AI — the tools companies need to monitor, govern,
          and trust the AI systems they run. Think of it as the control room that keeps
          enterprise AI reliable, observable, and under control as it scales.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Pitch Deck</h2>
        <div className="rounded-xl overflow-hidden border border-white/10 h-[50vh] min-h-[320px] md:h-[460px]">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                Loading pitch deck…
              </div>
            }
          >
            <PdfViewer
              src={pitchDeck.localPath}
              title="Tokenistt Pitch Deck"
              downloadName={pitchDeck.downloadName}
              theme="dark"
              className="h-full"
            />
          </Suspense>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Roadmap</h2>
        <div className="space-y-2">
          {founderHQ.roadmap.map((r) => (
            <div key={r.quarter} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
              <span className="text-xs text-gray-500 w-20">{r.quarter}</span>
              <span className="flex-1 text-sm">{r.item}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'done' ? 'bg-green-600/30' : r.status === 'in-progress' ? 'bg-yellow-600/30' : 'bg-gray-600/30'}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {founderHQ.metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">{m.label}</p>
              <p className="mt-1 text-lg font-semibold text-orange-400">{m.value}</p>
              <span className="text-[11px] text-gray-500">
                {m.trend === 'up' ? '▲ trending' : m.trend === 'down' ? '▼ down' : '— steady'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Traction</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          {founderHQ.traction.map((t) => <li key={t}>• {t}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">YC Journey</h2>
        <p className="text-sm text-gray-400">{founderHQ.ycJourney}</p>
      </section>
    </div>
  );
}
