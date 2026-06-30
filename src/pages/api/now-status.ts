import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT = {
  listening: 'Focus playlist',
  reading: 'AI Product Management',
  watching: 'System design talks',
  building: 'AdityaOS portfolio',
  thinking: 'LLM observability patterns',
  recentWins: ['IEEE Think Tank 2026 Winner', 'Mythos internship'],
  upcomingEvents: ['YC application', 'Masters prep'],
  currentGoals: ['Ship AdityaOS', 'Tokenistt beta'],
};

export const GET: APIRoute = async () => {
  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { data } = await supabase.from('now_status').select('*').limit(1).single();
    if (data) return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify(DEFAULT), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
