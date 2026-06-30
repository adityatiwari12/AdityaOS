import { useEffect, useRef, useState } from 'react';

interface CalendlyEmbedProps {
  url: string;
  className?: string;
}

const WIDGET_SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';
const WIDGET_CSS_HREF = 'https://assets.calendly.com/assets/external/widget.css';

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: Record<string, unknown>;
        utm?: Record<string, unknown>;
      }) => void;
    };
  }
}

function ensureCalendlyCss() {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[href="${WIDGET_CSS_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = WIDGET_CSS_HREF;
  document.head.appendChild(link);
}

function loadCalendlyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (window.Calendly) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SCRIPT_SRC}"]`);
    if (existing) {
      if (window.Calendly) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Calendly script failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Calendly script failed to load'));
    document.body.appendChild(script);
  });
}

/**
 * Renders Calendly's official inline scheduling widget (via widget.js).
 * The host should provide sizing; this fills its container.
 */
export default function CalendlyEmbed({ url, className }: CalendlyEmbedProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureCalendlyCss();

    loadCalendlyScript()
      .then(() => {
        if (cancelled || !widgetRef.current || !window.Calendly) return;
        widgetRef.current.innerHTML = '';
        const embedUrl = `${url}${url.includes('?') ? '&' : '?'}hide_gdpr_banner=1&background_color=1d1d1f&text_color=ffffff&primary_color=2563eb`;
        window.Calendly.initInlineWidget({ url: embedUrl, parentElement: widgetRef.current });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center text-center text-sm text-gray-400 p-6 ${className ?? ''}`}>
        <span>
          Unable to load the scheduler.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            Open Calendly in a new tab
          </a>
          .
        </span>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className={`calendly-inline-widget ${className ?? ''}`}
      style={{ minWidth: 320 }}
      aria-label="Schedule a call via Calendly"
    />
  );
}
