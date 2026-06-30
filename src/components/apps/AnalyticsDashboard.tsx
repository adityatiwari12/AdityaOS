import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#22c55e', '#ec4899'];

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    visitors: 0,
    avgSession: '0m',
    topProject: 'TalkwithDB',
    resumeDownloads: 0,
    countries: [{ name: 'India', value: 1 }],
    events: [] as { name: string; count: number }[],
  });

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="h-full overflow-y-auto text-gray-200 p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Visitors', value: stats.visitors },
          { label: 'Avg Session', value: stats.avgSession },
          { label: 'Top Project', value: stats.topProject },
          { label: 'Resume Downloads', value: stats.resumeDownloads },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-white/5">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6 h-64">
        <div>
          <h2 className="text-sm font-semibold mb-2">Countries</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={stats.countries} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {stats.countries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-2">Events</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={stats.events.length ? stats.events : [{ name: 'page_view', count: 1 }]}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
