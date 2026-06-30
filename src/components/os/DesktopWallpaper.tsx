import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOSStore } from '../../stores/osStore';
import { fetchVisitorWeather, getTimeOfDay, getTimeOfDayGradient } from '../../lib/weather';
import { useReducedMotion } from '../../lib/reducedMotion';
import WeatherEffects from './WeatherEffects';

interface DesktopWallpaperProps {
  backgroundMap: Record<string, string>;
  fallbackBg: string;
}

export default function DesktopWallpaper({ backgroundMap, fallbackBg }: DesktopWallpaperProps) {
  const timeOfDay = useOSStore((s) => s.timeOfDay);
  const weather = useOSStore((s) => s.weather);
  const setTimeOfDay = useOSStore((s) => s.setTimeOfDay);
  const setWeather = useOSStore((s) => s.setWeather);
  const customWallpaper = useOSStore((s) => s.customWallpaper);
  const booted = useOSStore((s) => s.booted);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const reduced = useReducedMotion();

  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(getTimeOfDay(hour));
    fetchVisitorWeather().then(setWeather);
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay(new Date().getHours())), 60000);
    return () => clearInterval(interval);
  }, [setTimeOfDay, setWeather]);

  useEffect(() => {
    if (reduced) return;
    const handler = (e: MouseEvent) => {
      setMouse({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [reduced]);

  // Wallpaper priority: user-uploaded custom image → selected wallpaper (Apple
  // photo or gradient). Time-of-day & weather are applied as subtle overlays.
  const bgValue = customWallpaper ?? backgroundMap[fallbackBg];
  const isGradientBg = !!bgValue && bgValue.includes('gradient');
  const bgImage = isGradientBg ? undefined : bgValue;
  const gradient = getTimeOfDayGradient(timeOfDay);
  const timeOverlayOpacity = timeOfDay === 'night' ? 0.45 : timeOfDay === 'evening' ? 0.3 : 0.16;
  const weatherTint = weather?.condition === 'rain' ? 'rgba(30,45,80,0.30)' :
    weather?.condition === 'snow' ? 'rgba(200,215,245,0.12)' :
    weather?.condition === 'clouds' ? 'rgba(55,65,85,0.20)' :
    weather?.condition === 'thunderstorm' ? 'rgba(15,15,35,0.42)' : 'transparent';

  const parallax = reduced ? undefined : `translate(${(mouse.x - 50) * 0.02}%, ${(mouse.y - 50) * 0.02}%) scale(1.05)`;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: booted ? 1 : 0 }}
      transition={{ duration: 1 }}
    >
      {/* macOS photo base (or user custom wallpaper). Gradients are valid
          backgroundImage values too, so we never mix the `background` shorthand. */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-[3000ms]"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : (isGradientBg ? bgValue : gradient),
          transform: parallax,
        }}
      />

      {/* Subtle time-of-day wash so the desktop adapts morning → night */}
      <div
        className="absolute inset-0 transition-opacity duration-[3000ms] mix-blend-soft-light pointer-events-none"
        style={{ background: gradient, opacity: timeOverlayOpacity }}
      />

      {/* Weather mood tint */}
      <div className="absolute inset-0 transition-colors duration-[2000ms] pointer-events-none" style={{ background: weatherTint }} />

      {/* Animated weather: rain / snow / clouds / thunderstorm */}
      <WeatherEffects condition={weather?.condition} reduced={reduced} />

      {/* Cursor spotlight */}
      {!reduced && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,0.06), transparent 40%)`,
          }}
        />
      )}
    </motion.div>
  );
}
