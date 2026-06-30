export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getTimeOfDayGradient(tod: TimeOfDay): string {
  const map: Record<TimeOfDay, string> = {
    morning: 'var(--gradient-morning)',
    afternoon: 'var(--gradient-afternoon)',
    evening: 'var(--gradient-evening)',
    night: 'var(--gradient-night)',
  };
  return map[tod];
}

export interface WeatherResult {
  temp: number;
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm';
  description: string;
  timezone: string;
  city?: string;
}

export async function fetchVisitorWeather(): Promise<WeatherResult> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    // Geolocation + weather happen server-side (/api/weather) to avoid browser
    // CORS issues with IP-geolocation providers.
    const res = await fetch('/api/weather');
    if (!res.ok) throw new Error(`weather ${res.status}`);
    const data = await res.json();
    const condition = (data.condition ?? 'clear') as WeatherResult['condition'];
    return {
      temp: typeof data.temp === 'number' ? data.temp : 28,
      condition,
      description: data.description ?? 'Clear',
      timezone: tz,
      city: data.city ?? 'Indore',
    };
  } catch {
    return { temp: 28, condition: 'clear', description: 'Clear', timezone: tz, city: 'Indore' };
  }
}
