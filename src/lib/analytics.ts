export async function trackEvent(event: string, metadata?: Record<string, unknown>) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, metadata, timestamp: new Date().toISOString() }),
    });
  } catch {
    // silent
  }
}

export function trackPageView() {
  trackEvent('page_view', { path: window.location.pathname });
}

export function trackAppOpen(appId: string) {
  trackEvent('app_open', { appId });
}

export function trackResumeDownload() {
  trackEvent('resume_download');
}

export function trackGitHubClick() {
  trackEvent('github_click');
}
