-- AdityaOS Supabase schema (run in Supabase SQL editor)

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS build_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked')),
  description TEXT,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS now_status (
  id INT PRIMARY KEY DEFAULT 1,
  listening TEXT,
  reading TEXT,
  watching TEXT,
  building TEXT,
  thinking TEXT,
  recent_wins JSONB DEFAULT '[]',
  upcoming_events JSONB DEFAULT '[]',
  current_goals JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  id TEXT PRIMARY KEY,
  quarter TEXT,
  item TEXT,
  status TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS startup_metrics (
  id TEXT PRIMARY KEY,
  label TEXT,
  value TEXT,
  trend TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guestbook (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: public read for now_status, build_tasks; writes via service role only
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE now_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read build_tasks" ON build_tasks FOR SELECT USING (true);
CREATE POLICY "Public read now_status" ON now_status FOR SELECT USING (true);
