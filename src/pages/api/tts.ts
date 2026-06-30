import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const key = import.meta.env.SARVAM_API_KEY as string | undefined;
  if (!key) {
    return new Response(JSON.stringify({ error: 'TTS not configured' }), { status: 503 });
  }

  let text: string;
  try {
    const body = await request.json();
    text = String(body?.text ?? '').trim().slice(0, 500);
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }

  if (!text) return new Response(JSON.stringify({ error: 'Empty text' }), { status: 400 });

  try {
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: 'en-IN',
        speaker: 'ankit',
        model: 'bulbul:v2',
        pitch: 0,
        pace: 0.95,
        loudness: 1.4,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      return new Response(JSON.stringify({ error: err }), { status: 502 });
    }

    const data = await res.json() as { audios?: string[] };
    const b64 = data?.audios?.[0];
    if (!b64) return new Response(JSON.stringify({ error: 'No audio returned' }), { status: 502 });

    return new Response(JSON.stringify({ audio: b64 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502 });
  }
};
