import { useEffect, useState } from "react";

interface Stats {
  total: number;
  byAction: Record<string, number>;
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((data: Stats) => setStats(data));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="Total Events" value={stats.total} color="text-white" />
      <StatCard
        label="Blocked"
        value={stats.byAction["block"] ?? 0}
        color="text-red-400"
      />
      <StatCard
        label="Redacted"
        value={stats.byAction["redact"] ?? 0}
        color="text-yellow-400"
      />
      <StatCard
        label="Flagged"
        value={stats.byAction["flag"] ?? 0}
        color="text-blue-400"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
