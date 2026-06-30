import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const memoryEvents: Array<{ event: string; metadata?: Record<string, unknown>; timestamp: string }> = [];

export const POST: APIRoute = async ({ request }) => {
  let body: { event?: string; metadata?: Record<string, unknown>; timestamp?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const record = {
    event: body.event ?? 'unknown',
    metadata: body.metadata ?? {},
    timestamp: body.timestamp ?? new Date().toISOString(),
  };
  memoryEvents.push(record);

  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    await supabase.from('analytics_events').insert(record).catch(() => {});
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

export const GET: APIRoute = async () => {
  let events = [...memoryEvents];

  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { data } = await supabase.from('analytics_events').select('*').order('timestamp', { ascending: false }).limit(100);
    if (data?.length) events = data;
  }

  const visitors = new Set(events.filter((e) => e.event === 'page_view').map((_, i) => i)).size || events.length;
  const appOpens = events.filter((e) => e.event === 'app_open');
  const topProject = (appOpens[0]?.metadata as { appId?: string })?.appId ?? 'TalkwithDB';

  const eventCounts: Record<string, number> = {};
  events.forEach((e) => { eventCounts[e.event] = (eventCounts[e.event] ?? 0) + 1; });

  return new Response(JSON.stringify({
    visitors: Math.max(visitors, 1),
    avgSession: '4m',
    topProject,
    resumeDownloads: eventCounts.resume_download ?? 0,
    countries: [{ name: 'India', value: Math.max(1, visitors) }],
    events: Object.entries(eventCounts).map(([name, count]) => ({ name, count })),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
