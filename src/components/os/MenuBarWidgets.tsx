import { useEffect, useState } from 'react';
import { BsCpu, BsMemory, BsDeviceSsd } from 'react-icons/bs';
import { useOSStore } from '../../stores/osStore';

export function useSystemWidgets() {
  const weather = useOSStore((s) => s.weather);
  const [cpu, setCpu] = useState(12);
  const [mem, setMem] = useState(45);
  const [storage, setStorage] = useState(62);
  const [battery, setBattery] = useState(87);
  const [charging, setCharging] = useState(false);
  const [network, setNetwork] = useState(true);
  const [signal, setSignal] = useState(3);

  useEffect(() => {
    const tick = () => {
      setCpu((c) => Math.max(4, Math.min(96, c + (Math.random() - 0.5) * 18)));
      setMem((m) => Math.max(28, Math.min(92, m + (Math.random() - 0.5) * 6)));
      setStorage((s) => Math.max(40, Math.min(99, s + (Math.random() - 0.5) * 0.4)));
      setBattery((b) => {
        const next = charging ? b + Math.random() * 0.6 : b - Math.random() * 0.25;
        if (next >= 100) setCharging(false);
        if (next <= 22) setCharging(true);
        return Math.max(20, Math.min(100, next));
      });
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setNetwork(online);
      setSignal(online ? 2 + Math.round(Math.random()) : 0);
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [charging]);

  return { weather, cpu, mem, storage, battery, charging, network, signal };
}

function Meter({ icon, value, color }: { icon: React.ReactNode; value: number; color: string }) {
  return (
    <span className="flex items-center gap-1" title={`${value.toFixed(0)}%`}>
      {icon}
      <span className="relative h-1.5 w-8 rounded-full bg-white/15 overflow-hidden">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${color} transition-[width] duration-[1500ms] ease-out`}
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}

function Battery({ level, charging }: { level: number; charging: boolean }) {
  const color = level > 50 ? 'bg-green-400' : level > 25 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <span className="flex items-center gap-1" title={`Battery ${level.toFixed(0)}%${charging ? ' (charging)' : ''}`}>
      <span className="relative flex items-center">
        <span className="relative w-6 h-3 rounded-[3px] border border-white/50 p-[1.5px]">
          <span
            className={`block h-full rounded-[1px] ${color} transition-[width] duration-[1500ms] ease-out`}
            style={{ width: `${level}%` }}
          />
        </span>
        <span className="w-[2px] h-1.5 bg-white/50 rounded-r-sm" />
      </span>
      <span className="tabular-nums">{charging ? '⚡' : ''}{level.toFixed(0)}%</span>
    </span>
  );
}

function NetworkBars({ online, signal }: { online: boolean; signal: number }) {
  if (!online) return <span className="text-red-400" title="Offline">Offline</span>;
  return (
    <span className="flex items-end gap-[2px] h-3" title={`Online · signal ${signal}/3`}>
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          className={`w-[3px] rounded-sm transition-all duration-700 ${b <= signal ? 'bg-gray-200' : 'bg-white/20'}`}
          style={{ height: `${b * 4}px` }}
        />
      ))}
    </span>
  );
}

function tzOffset(): string {
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

export default function MenuBarWidgets() {
  const { weather, cpu, mem, storage, battery, charging, network, signal } = useSystemWidgets();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [tz, setTz] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
      setTz(tzOffset());
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 text-xs text-gray-200">
      <span className="hidden 2xl:flex"><Meter icon={<BsCpu size={13} className="text-sky-300" />} value={cpu} color="bg-sky-400" /></span>
      <span className="hidden 2xl:flex"><Meter icon={<BsMemory size={13} className="text-violet-300" />} value={mem} color="bg-violet-400" /></span>
      <span className="hidden 2xl:flex"><Meter icon={<BsDeviceSsd size={13} className="text-amber-300" />} value={storage} color="bg-amber-400" /></span>
      <span className="hidden lg:flex"><NetworkBars online={network} signal={signal} /></span>
      <Battery level={battery} charging={charging} />
      {weather && (
        <span title={weather.description} className="hidden xl:flex items-center gap-1">
          {weather.temp}°C · {weather.city}
        </span>
      )}
      <span className="hidden 2xl:inline text-gray-400">{tz}</span>
      <span className="hidden xl:inline">{date}</span>
      <span className="font-medium tabular-nums">{time}</span>
    </div>
  );
}
