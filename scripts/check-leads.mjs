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
console.log('Rows:', await sql`SELECT id,name,email,source,created_at FROM leads ORDER BY id DESC LIMIT 10`);
await sql`DELETE FROM leads WHERE email = 'prodsmoke@example.com'`;
console.log('After cleanup count:', (await sql`SELECT count(*)::int AS c FROM leads`)[0]);
