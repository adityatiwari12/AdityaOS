import { useMemo } from 'react';
import type { WeatherResult } from '../../lib/weather';

interface WeatherEffectsProps {
  condition?: WeatherResult['condition'];
  reduced?: boolean;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function WeatherEffects({ condition, reduced }: WeatherEffectsProps) {
  const drops = useMemo(() => {
    const rand = seededRandom(11);
    return Array.from({ length: 70 }, () => ({
      left: rand() * 100,
      delay: rand() * 2,
      duration: 0.5 + rand() * 0.6,
      opacity: 0.3 + rand() * 0.5,
    }));
  }, []);

  const flakes = useMemo(() => {
    const rand = seededRandom(29);
    return Array.from({ length: 60 }, () => ({
      left: rand() * 100,
      delay: rand() * 6,
      duration: 6 + rand() * 6,
      size: 3 + rand() * 5,
      opacity: 0.5 + rand() * 0.5,
    }));
  }, []);

  const clouds = useMemo(() => {
    const rand = seededRandom(53);
    return Array.from({ length: 6 }, () => ({
      top: rand() * 50,
      delay: -rand() * 60,
      duration: 60 + rand() * 60,
      width: 280 + rand() * 320,
      height: 120 + rand() * 120,
      opacity: 0.25 + rand() * 0.35,
    }));
  }, []);

  if (reduced || !condition || condition === 'clear') return null;

  const showRain = condition === 'rain' || condition === 'thunderstorm';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {condition === 'clouds' &&
        clouds.map((c, i) => (
          <span
            key={i}
            className="wx-cloud"
            style={{
              top: `${c.top}%`,
              width: c.width,
              height: c.height,
              opacity: c.opacity,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}

      {showRain &&
        drops.map((d, i) => (
          <span
            key={i}
            className="wx-drop"
            style={{
              left: `${d.left}%`,
              opacity: d.opacity,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          />
        ))}

      {condition === 'snow' &&
        flakes.map((f, i) => (
          <span
            key={i}
            className="wx-flake"
            style={{
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
            }}
          />
        ))}

      {condition === 'thunderstorm' && <div className="wx-lightning" />}
    </div>
  );
}
