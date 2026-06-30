// Adds OAuth columns to the leads table. Run: node scripts/migrate-oauth.mjs
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
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS provider TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false`,
];

for (const stmt of statements) {
  await sql.query(stmt);
  console.log('OK:', stmt);
}

const rows = await sql.query(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position`
);
console.log('leads columns:', rows);
console.log('Done.');
