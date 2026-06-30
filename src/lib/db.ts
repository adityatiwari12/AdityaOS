import { neon } from '@neondatabase/serverless';

/**
 * Neon Postgres client for lead capture (contact form + copilot email gate).
 *
 * The connection string lives in the DATABASE_URL env var (never committed).
 * `getSql()` returns a tagged-template query function, or null when the DB is
 * not configured so callers can degrade gracefully instead of crashing.
 */

type Sql = ReturnType<typeof neon>;

let cached: Sql | null | undefined;

export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url =
    import.meta.env.DATABASE_URL ||
    (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);
  cached = url ? neon(url) : null;
  return cached;
}

export type LeadSource = 'contact' | 'copilot';
export type LeadProvider = 'google' | 'github' | 'manual';

export interface LeadInput {
  name: string;
  email: string;
  message?: string | null;
  source: LeadSource;
  provider?: LeadProvider | null;
  verified?: boolean;
  ip?: string | null;
  userAgent?: string | null;
}

/** Insert a lead. Returns true on success, false if the DB isn't configured. */
export async function saveLead(lead: LeadInput): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await sql`
    INSERT INTO leads (name, email, message, source, provider, verified, ip, user_agent)
    VALUES (
      ${lead.name},
      ${lead.email},
      ${lead.message ?? null},
      ${lead.source},
      ${lead.provider ?? 'manual'},
      ${lead.verified ?? false},
      ${lead.ip ?? null},
      ${lead.userAgent ?? null}
    )
  `;
  return true;
}
