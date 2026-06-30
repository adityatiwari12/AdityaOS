import type { APIRoute } from 'astro';
import { saveLead, type LeadSource } from '../../lib/db';
import { clientIp, deriveIdent, markVerified } from '../../lib/copilotGuard';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bad = (message: string, status = 400) => json({ message }, status);

/**
 * Lead capture endpoint — stores name + email (+ optional message) in Neon.
 * Used by both the contact form (source: "contact") and the AI Copilot
 * email gate that unlocks after 3 prompts (source: "copilot").
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON', 400);
  }

  const { name, email, message, company, source } = body || {};

  if (!name || !email) return bad('Missing required fields', 400);
  if (typeof name !== 'string' || typeof email !== 'string') return bad('Invalid field types', 400);
  if (!/.+@.+\..+/.test(email)) return bad('Invalid email', 400);
  // Honeypot — bots fill hidden fields.
  if (company && String(company).trim() !== '') return bad('Spam detected', 400);

  const safeSource: LeadSource = source === 'copilot' ? 'copilot' : 'contact';

  const ip = clientIp(request, clientAddress);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Fallback (no-OAuth) copilot unlock: mark this identity verified server-side
  // so the gate is consistent with the OAuth path.
  if (safeSource === 'copilot') {
    await markVerified(deriveIdent(ip, userAgent), { email, name, provider: 'manual' });
  }

  try {
    const saved = await saveLead({
      name: name.trim().slice(0, 200),
      email: email.trim().slice(0, 320),
      message: typeof message === 'string' ? message.slice(0, 4000) : null,
      source: safeSource,
      ip,
      userAgent,
    });

    if (!saved) {
      return json(
        { code: 'UNCONFIGURED', message: 'Lead database is not configured.' },
        503
      );
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error('[lead] insert error', e?.message || e);
    return bad('Failed to save. Please try again later.', 502);
  }
};

export const GET: APIRoute = async () => json({ ok: true });
