import type { APIRoute } from 'astro';
import { saveLead } from '../../../lib/db';
import { clientIp, deriveIdent, markVerified } from '../../../lib/copilotGuard';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const CLIENT_ID =
  import.meta.env.PUBLIC_GOOGLE_CLIENT_ID ||
  (typeof process !== 'undefined' ? process.env.PUBLIC_GOOGLE_CLIENT_ID : undefined);

/**
 * Verifies a Google Identity Services ID token (JWT) and records the verified
 * visitor as a lead. We validate against Google's tokeninfo endpoint so no
 * extra crypto dependency is needed; audience + email_verified are enforced.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!CLIENT_ID) return json({ message: 'Google sign-in is not configured.' }, 503);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON' }, 400);
  }

  const credential = body?.credential;
  if (!credential || typeof credential !== 'string') {
    return json({ message: 'Missing credential' }, 400);
  }

  let payload: any;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!res.ok) return json({ message: 'Invalid Google token' }, 401);
    payload = await res.json();
  } catch {
    return json({ message: 'Could not verify Google token' }, 502);
  }

  // Audience + issuer + email checks.
  if (payload.aud !== CLIENT_ID) return json({ message: 'Token audience mismatch' }, 401);
  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
    return json({ message: 'Invalid token issuer' }, 401);
  }
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!payload.email || !emailVerified) {
    return json({ message: 'Email not verified by Google' }, 401);
  }

  const name = (payload.name || payload.given_name || payload.email.split('@')[0]) as string;
  const email = payload.email as string;

  const ip = clientIp(request, clientAddress);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Mark this network identity as verified so the copilot gate unlocks
  // server-side and cannot be reset by clearing cookies/localStorage.
  await markVerified(deriveIdent(ip, userAgent), { email, name, provider: 'google' });

  try {
    await saveLead({
      name: name.slice(0, 200),
      email: email.slice(0, 320),
      message: typeof body?.message === 'string' ? body.message.slice(0, 4000) : null,
      source: 'copilot',
      provider: 'google',
      verified: true,
      ip,
      userAgent,
    });
  } catch (e: any) {
    // Don't block sign-in on a DB hiccup; the identity is already verified.
    console.error('[auth/google] saveLead error', e?.message || e);
  }

  return json({ ok: true, user: { name, email, provider: 'google', verified: true } });
};
