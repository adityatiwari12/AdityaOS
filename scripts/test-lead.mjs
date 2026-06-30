// Smoke test: insert a lead and read it back. Run: node scripts/test-lead.mjs
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sql = neon(process.env.DATABASE_URL);
await sql`INSERT INTO leads (name, email, message, source, ip, user_agent)
  VALUES ('Test User', 'test@example.com', 'smoke test message', 'copilot', '127.0.0.1', 'node-test')`;
const rows = await sql`SELECT id, name, email, source, created_at FROM leads ORDER BY id DESC LIMIT 5`;
console.log('Recent leads:', rows);
// Clean up the smoke-test row so it doesn't pollute real data.
await sql`DELETE FROM leads WHERE email = 'test@example.com' AND user_agent = 'node-test'`;
console.log('Cleaned up test row. Count now:', (await sql`SELECT count(*)::int AS c FROM leads`)[0]);
