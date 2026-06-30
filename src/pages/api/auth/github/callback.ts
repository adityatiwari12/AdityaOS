import type { APIRoute } from 'astro';
import { saveLead } from '../../../../lib/db';
import { clientIp, deriveIdent, markVerified } from '../../../../lib/copilotGuard';

const CLIENT_ID =
  import.meta.env.PUBLIC_GITHUB_CLIENT_ID ||
  (typeof process !== 'undefined' ? process.env.PUBLIC_GITHUB_CLIENT_ID : undefined);
const CLIENT_SECRET =
  import.meta.env.GITHUB_CLIENT_SECRET ||
  (typeof process !== 'undefined' ? process.env.GITHUB_CLIENT_SECRET : undefined);

/** Renders a tiny page that hands the result back to the opener window. */
function closingPage(origin: string, payload: Record<string, unknown>): Response {
  const data = JSON.stringify(payload).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body style="font-family:-apple-system,system-ui,sans-serif;background:#1d1d1f;color:#ececec;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Completing sign-in…</p>
<script>
(function () {
  var payload = ${data};
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'github-oauth', payload: payload }, ${JSON.stringify(origin)});
    }
  } catch (e) {}
  setTimeout(function () { window.close(); }, 300);
})();
</script>
</body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export const GET: APIRoute = async ({ request, url, clientAddress }) => {
  const origin = url.origin;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return closingPage(origin, { ok: false, error: 'GitHub sign-in is not configured.' });
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';
  if (!code) {
    return closingPage(origin, { ok: false, error: 'Missing authorization code.' });
  }

  try {
    // Exchange the code for an access token.
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/auth/github/callback`,
      }),
    });
    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      return closingPage(origin, { ok: false, error: 'Could not obtain GitHub token.', state });
    }

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AdityaOS-Portfolio',
    };

    const [userRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    const ghUser: any = await userRes.json();
    const emails: any[] = emailRes.ok ? await emailRes.json() : [];

    const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
    const email = primary?.email || ghUser?.email;
    const name = ghUser?.name || ghUser?.login || (email ? email.split('@')[0] : 'GitHub user');

    if (!email) {
      return closingPage(origin, {
        ok: false,
        error: 'No verified email on your GitHub account.',
        state,
      });
    }

    const ip = clientIp(request, clientAddress);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Mark this network identity verified server-side (bypass-proof gate).
    await markVerified(deriveIdent(ip, userAgent), {
      email: String(email),
      name: String(name),
      provider: 'github',
    });

    try {
      await saveLead({
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 320),
        message: null,
        source: 'copilot',
        provider: 'github',
        verified: true,
        ip,
        userAgent,
      });
    } catch (e: any) {
      console.error('[auth/github] saveLead error', e?.message || e);
    }

    return closingPage(origin, {
      ok: true,
      state,
      user: { name, email, provider: 'github', verified: true },
    });
  } catch (e: any) {
    console.error('[auth/github] error', e?.message || e);
    return closingPage(origin, { ok: false, error: 'GitHub sign-in failed.', state });
  }
};
