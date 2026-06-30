// One-off: create the `leads` table in Neon. Run with:
//   node scripts/init-db.mjs
// Requires DATABASE_URL in the environment (loaded from .env below).
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Minimal .env loader (no extra dependency).
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // ignore — rely on real env vars
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS leads (
     id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     name        TEXT NOT NULL,
     email       TEXT NOT NULL,
     message     TEXT,
     source      TEXT NOT NULL DEFAULT 'contact',
     ip          TEXT,
     user_agent  TEXT,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email)`,
  `CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC)`,
];

for (const stmt of statements) {
  await sql.query(stmt);
  console.log('OK:', stmt.split('\n')[0].slice(0, 60));
}

const rows = await sql.query(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position`
);
console.log('leads columns:', rows);
console.log('Done.');
