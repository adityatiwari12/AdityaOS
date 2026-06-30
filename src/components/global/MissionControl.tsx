import React, { useEffect } from 'react';
import { dockApps } from '../../os/appRegistry';

interface MissionControlProps {
  isOpen: boolean;
  onClose: () => void;
  activeApps: Record<string, boolean>;
  onAppClick: (app: string) => void;
  onAppClose: (app: string) => void;
  title?: string;
}

export default function MissionControl({ isOpen, onClose, activeApps, onAppClick, onAppClose, title = 'Mission Control' }: MissionControlProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const apps = dockApps.map((def) => ({
    id: def.id,
    name: def.title,
    icon: def.icon,
    color: def.color,
    active: activeApps[def.id] ?? false,
  }));

  const activeWindows = apps.filter((app) => app.active);

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
        <h2 className="text-white text-2xl font-semibold mb-8">{title}</h2>
        {activeWindows.length === 0 ? (
          <p className="text-gray-400 text-lg">No open windows</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
            {activeWindows.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => { onAppClick(app.id); onClose(); }}
                  className="group relative bg-gray-800/50 rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all hover:scale-105"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-20 h-20 bg-gradient-to-t ${app.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon size={40} className="text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">{app.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAppClose(app.id); }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white text-xs bg-white/10 px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-gray-400 text-sm mt-8">Press Esc to close</p>
      </div>
    </div>
  );
}
