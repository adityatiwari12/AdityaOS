import type { APIRoute } from 'astro';
import { saveLead } from '../../lib/db';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bad = (message: string, status = 400) => json({ message }, status);

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON', 400);
  }

  const { name, email, message, company, t } = body || {};

  // Basic validations
  if (!name || !email || !message) return bad('Missing required fields', 400);
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') return bad('Invalid field types', 400);
  if (!/.+@.+\..+/.test(email)) return bad('Invalid email', 400);
  if (company && String(company).trim() !== '') return bad('Spam detected', 400); // honeypot
  if (typeof t === 'number' && t < 5) return bad('Too fast. Please take a moment before sending.', 429);

  const headers = request.headers;
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('cf-connecting-ip') || 'unknown';
  const userAgent = headers.get('user-agent') || 'unknown';

  try {
    const saved = await saveLead({
      name: name.trim().slice(0, 200),
      email: email.trim().slice(0, 320),
      message: message.slice(0, 4000),
      source: 'contact',
      ip,
      userAgent,
    });

    if (!saved) {
      return json({ code: 'UNCONFIGURED', message: 'Contact database is not configured. Use the email link instead.' }, 503);
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error('[contact] insert error', e?.message || e);
    return bad('Failed to save message. Please try again later.', 502);
  }
};

export const GET: APIRoute = async () => json({ ok: true });
