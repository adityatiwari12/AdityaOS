import { Suspense } from 'react';
import { useOSStore } from '../stores/osStore';
import { getAppDefinition } from './appRegistry';
import OSWindow from '../components/os/OSWindow';
import AppErrorBoundary from '../components/os/AppErrorBoundary';

const LazyFallback = () => (
  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>
);

export default function WindowManager() {
  const windows = useOSStore((s) => s.windows);
  const closeWindow = useOSStore((s) => s.closeWindow);

  return (
    <>
      {windows.map((win) => {
        const def = getAppDefinition(win.appId);
        if (!def) return null;
        const Component = def.component;

        if (def.legacyWindow) {
          const inner = (
            <AppErrorBoundary key={win.id} appTitle={win.title || def.title}>
              <Suspense fallback={null}>
                <Component
                  windowId={win.id}
                  onClose={() => closeWindow(win.id)}
                  payload={win.payload}
                />
              </Suspense>
            </AppErrorBoundary>
          );
          return win.openFullscreen ? (
            <div key={win.id} style={{ position: 'fixed', inset: 0, top: 36, zIndex: 280 + win.zIndex }}>
              {inner}
            </div>
          ) : inner;
        }

        return (
          <OSWindow key={win.id} windowState={win} title={win.title || def.title}>
            <AppErrorBoundary appTitle={win.title || def.title}>
              <Suspense fallback={<LazyFallback />}>
                <Component
                  windowId={win.id}
                  onClose={() => closeWindow(win.id)}
                  payload={win.payload}
                />
              </Suspense>
            </AppErrorBoundary>
          </OSWindow>
        );
      })}
    </>
  );
}
