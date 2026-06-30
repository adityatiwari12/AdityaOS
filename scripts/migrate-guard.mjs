// Creates server-side rate-limit / auth tables. Run: node scripts/migrate-guard.mjs
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}
const sql = neon(url);

const statements = [
  // Per-identity daily usage + short burst window. Keyed by a hash of IP+UA so
  // clearing cookies/localStorage cannot reset it.
  `CREATE TABLE IF NOT EXISTS copilot_usage (
     ident        TEXT NOT NULL,
     day          DATE NOT NULL,
     count        INTEGER NOT NULL DEFAULT 0,
     last_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
     window_count INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (ident, day)
   )`,
  // Verified identities (set on OAuth sign-in), keyed by the same ident hash.
  `CREATE TABLE IF NOT EXISTS copilot_identity (
     ident       TEXT PRIMARY KEY,
     email       TEXT,
     name        TEXT,
     provider    TEXT,
     verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
];

for (const stmt of statements) {
  await sql.query(stmt);
  console.log('OK:', stmt.split('\n')[0]);
}
console.log('Done.');
