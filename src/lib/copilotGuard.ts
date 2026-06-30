import { createHash } from 'node:crypto';
import { getSql } from './db';

/**
 * Server-side guard for the AI Copilot.
 *
 * Security model: all limits and the auth gate are enforced on the server and
 * keyed by a hash of the visitor's IP + User-Agent — NOT by cookies or
 * localStorage. There is therefore no client-side token a user can delete to
 * reset their quota or bypass the sign-in gate. Verified identities and usage
 * counters live in Neon, so they persist across browsers/incognito on the same
 * network identity.
 *
 * Known limitation: switching networks (e.g. a VPN) yields a new IP and thus a
 * fresh quota. Defeating that requires mandatory accounts for everyone, which
 * is intentionally out of scope for a portfolio.
 */

export const FREE_PROMPTS = 3; // prompts allowed before sign-in is required
export const DAILY_LIMIT = 8; // hard cap per identity per day
const BURST_WINDOW_SECONDS = 15; // short anti-hammer window
const BURST_MAX = 5; // max prompts within the burst window

export type GuardCode = 'OK' | 'AUTH_REQUIRED' | 'DAILY_LIMIT' | 'RATE_LIMIT' | 'DB_UNAVAILABLE';

export interface GuardDecision {
  allowed: boolean;
  code: GuardCode;
  /** Prompts remaining today AFTER this request (only meaningful when allowed). */
  remaining: number;
  /** Whether this identity is a verified (signed-in) visitor. */
  authed: boolean;
}

function secret(): string {
  return (
    import.meta.env.APP_SECRET ||
    (typeof process !== 'undefined' ? process.env.APP_SECRET : undefined) ||
    import.meta.env.DATABASE_URL ||
    (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined) ||
    'aos-fallback-secret'
  );
}

/** Derive a stable, privacy-preserving identifier from the request. */
export function deriveIdent(ip: string | null | undefined, userAgent: string | null | undefined): string {
  const cleanIp = (ip || 'noip').split(',')[0].trim();
  const ua = (userAgent || 'noua').slice(0, 200);
  return createHash('sha256').update(`${cleanIp}|${ua}|${secret()}`).digest('hex').slice(0, 40);
}

/** Best-effort client IP extraction from an APIContext. */
export function clientIp(request: Request, clientAddress?: string): string {
  const h = request.headers;
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    clientAddress ||
    'unknown'
  );
}

export async function isVerified(ident: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    const rows = (await sql`SELECT 1 FROM copilot_identity WHERE ident = ${ident} LIMIT 1`) as any[];
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function markVerified(
  ident: string,
  info: { email?: string | null; name?: string | null; provider?: string | null }
): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO copilot_identity (ident, email, name, provider)
      VALUES (${ident}, ${info.email ?? null}, ${info.name ?? null}, ${info.provider ?? null})
      ON CONFLICT (ident) DO UPDATE
        SET email = COALESCE(EXCLUDED.email, copilot_identity.email),
            name = COALESCE(EXCLUDED.name, copilot_identity.name),
            provider = COALESCE(EXCLUDED.provider, copilot_identity.provider)
    `;
  } catch (e: any) {
    console.error('[guard] markVerified error', e?.message || e);
  }
}

interface UsageRow {
  count: number;
  windowStart: number; // epoch ms
  windowCount: number;
}

async function readUsage(ident: string): Promise<UsageRow> {
  const sql = getSql();
  if (!sql) return { count: 0, windowStart: Date.now(), windowCount: 0 };
  const rows = (await sql`
    SELECT count, window_count,
           EXTRACT(EPOCH FROM window_start) * 1000 AS window_start_ms
    FROM copilot_usage
    WHERE ident = ${ident} AND day = CURRENT_DATE
    LIMIT 1
  `) as any[];
  if (!rows.length) return { count: 0, windowStart: Date.now(), windowCount: 0 };
  return {
    count: Number(rows[0].count) || 0,
    windowStart: Number(rows[0].window_start_ms) || Date.now(),
    windowCount: Number(rows[0].window_count) || 0,
  };
}

/** Atomically increment today's count, resetting the burst window when stale. */
async function consume(ident: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  // make_interval(secs => N) keeps the trusted constant a bound parameter
  // (a bare `interval '$1 seconds'` would not parameterize correctly).
  await sql`
    INSERT INTO copilot_usage (ident, day, count, last_at, window_start, window_count)
    VALUES (${ident}, CURRENT_DATE, 1, now(), now(), 1)
    ON CONFLICT (ident, day) DO UPDATE SET
      count = copilot_usage.count + 1,
      last_at = now(),
      window_start = CASE
        WHEN now() - copilot_usage.window_start > make_interval(secs => ${BURST_WINDOW_SECONDS})
        THEN now() ELSE copilot_usage.window_start END,
      window_count = CASE
        WHEN now() - copilot_usage.window_start > make_interval(secs => ${BURST_WINDOW_SECONDS})
        THEN 1 ELSE copilot_usage.window_count + 1 END
  `;
}

/**
 * Evaluate the gate for a prompt and, if allowed, consume one unit of quota.
 * The auth gate does NOT consume quota (the prompt is rejected until sign-in).
 */
export async function guardPrompt(ident: string): Promise<GuardDecision> {
  const sql = getSql();
  if (!sql) {
    // No DB → fail open so the copilot still works, but nothing is enforced.
    return { allowed: true, code: 'DB_UNAVAILABLE', remaining: DAILY_LIMIT, authed: false };
  }

  let authed = false;
  let usage: UsageRow;
  try {
    [authed, usage] = await Promise.all([isVerified(ident), readUsage(ident)]);
  } catch (e: any) {
    console.error('[guard] read error', e?.message || e);
    return { allowed: true, code: 'DB_UNAVAILABLE', remaining: DAILY_LIMIT, authed: false };
  }

  const used = usage.count;
  const now = Date.now();
  const withinWindow = now - usage.windowStart <= BURST_WINDOW_SECONDS * 1000;

  // Burst / hammer protection.
  if (withinWindow && usage.windowCount >= BURST_MAX) {
    return { allowed: false, code: 'RATE_LIMIT', remaining: Math.max(0, DAILY_LIMIT - used), authed };
  }

  // Hard daily cap.
  if (used >= DAILY_LIMIT) {
    return { allowed: false, code: 'DAILY_LIMIT', remaining: 0, authed };
  }

  // Auth gate after the free allowance (does not consume).
  if (used >= FREE_PROMPTS && !authed) {
    return { allowed: false, code: 'AUTH_REQUIRED', remaining: Math.max(0, DAILY_LIMIT - used), authed };
  }

  try {
    await consume(ident);
  } catch (e: any) {
    console.error('[guard] consume error', e?.message || e);
    // Still allow the answer; we just failed to record it.
  }

  return { allowed: true, code: 'OK', remaining: Math.max(0, DAILY_LIMIT - (used + 1)), authed };
}
