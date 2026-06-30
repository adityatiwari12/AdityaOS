// Simulates the guard logic directly against Neon to confirm gate behavior.
// Run: node scripts/test-guard.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sql = neon(process.env.DATABASE_URL);
const FREE = 3, DAILY = 8;
const ident = 'test_' + createHash('sha256').update('guard-test-' + Date.now()).digest('hex').slice(0, 24);

async function isVerified(id) {
  const r = await sql`SELECT 1 FROM copilot_identity WHERE ident = ${id} LIMIT 1`;
  return r.length > 0;
}
async function readCount(id) {
  const r = await sql`SELECT count FROM copilot_usage WHERE ident = ${id} AND day = CURRENT_DATE`;
  return r.length ? Number(r[0].count) : 0;
}
async function consume(id) {
  await sql`INSERT INTO copilot_usage (ident, day, count) VALUES (${id}, CURRENT_DATE, 1)
    ON CONFLICT (ident, day) DO UPDATE SET count = copilot_usage.count + 1`;
}
async function guard(id) {
  const [authed, used] = [await isVerified(id), await readCount(id)];
  if (used >= DAILY) return { code: 'DAILY_LIMIT' };
  if (used >= FREE && !authed) return { code: 'AUTH_REQUIRED' };
  await consume(id);
  return { code: 'OK', count: used + 1 };
}

const log = [];
for (let i = 1; i <= 5; i++) log.push(`prompt ${i}: ${(await guard(ident)).code}`);
console.log('Before auth:'); log.forEach((l) => console.log('  ' + l));

console.log('Signing in (markVerified)…');
await sql`INSERT INTO copilot_identity (ident, email, provider) VALUES (${ident}, 'test@example.com', 'test')
  ON CONFLICT (ident) DO NOTHING`;

const after = [];
for (let i = 0; i < 8; i++) after.push((await guard(ident)).code);
console.log('After auth (should allow up to 8 total, then DAILY_LIMIT):');
console.log('  ' + after.join(', '));

// Cleanup
await sql`DELETE FROM copilot_usage WHERE ident = ${ident}`;
await sql`DELETE FROM copilot_identity WHERE ident = ${ident}`;
console.log('Cleaned up test identity.');
