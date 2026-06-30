import type { APIRoute } from 'astro';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
  });

function mapWeatherCode(code: number) {
  if (code === 0) return 'clear';
  if (code <= 3) return 'clouds';
  if (code <= 67 || code === 80 || code === 81) return 'rain';
  if (code <= 77 || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'clouds';
}

const DESCRIPTIONS: Record<string, string> = {
  clear: 'Clear',
  clouds: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  thunderstorm: 'Storm',
};

const FALLBACK = { lat: 22.7, lon: 75.9, city: 'Indore' };

/**
 * Server-side weather lookup. Geolocates the visitor's IP (no browser CORS),
 * then fetches Open-Meteo. Falls back gracefully to Indore on any failure.
 */
export const GET: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '';

  let lat = FALLBACK.lat;
  let lon = FALLBACK.lon;
  let city = FALLBACK.city;

  try {
    // ipwho.is is CORS/HTTPS friendly and works server-side with an explicit IP.
    const geoUrl = ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : 'https://ipwho.is/';
    const geoRes = await fetch(geoUrl);
    if (geoRes.ok) {
      const geo: any = await geoRes.json();
      if (geo?.success !== false && typeof geo.latitude === 'number') {
        lat = geo.latitude;
        lon = geo.longitude;
        city = geo.city || city;
      }
    }
  } catch {
    // keep fallback coordinates
  }

  try {
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );
    const wx: any = await wxRes.json();
    const code = wx.current?.weather_code ?? 0;
    const condition = mapWeatherCode(code);
    return json({
      temp: Math.round(wx.current?.temperature_2m ?? 28),
      condition,
      description: DESCRIPTIONS[condition],
      city,
    });
  } catch {
    return json({ temp: 28, condition: 'clear', description: 'Clear', city });
  }
};
