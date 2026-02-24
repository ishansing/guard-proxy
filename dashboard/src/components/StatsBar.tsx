import { useEffect, useState } from "react";

interface Stats {
  total: number;
  byAction: Record<string, number>;
  byRule: Record<string, number>;
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats);
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
      <Stat label="Total Events" value={stats.total} />
      <Stat
        label="Blocked"
        value={stats.byAction["block"] ?? 0}
        color="text-red-600"
      />
      <Stat
        label="Redacted"
        value={stats.byAction["redact"] ?? 0}
        color="text-yellow-600"
      />
      <Stat
        label="Flagged"
        value={stats.byAction["flag"] ?? 0}
        color="text-blue-600"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-gray-900",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
