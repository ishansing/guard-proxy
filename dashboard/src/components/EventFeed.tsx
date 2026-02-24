import { useDLPEvents } from "../hooks/useDLPEvents";

const ACTION_COLORS: Record<string, string> = {
  block: "bg-red-100 text-red-800",
  redact: "bg-yellow-100 text-yellow-800",
  flag: "bg-blue-100 text-blue-800",
  "log-only": "bg-gray-100 text-gray-600",
  allow: "bg-green-100 text-green-800",
};

export function EventFeed() {
  const events = useDLPEvents();

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-xl font-bold mb-2">Live Traffic Feed</h2>
      {events.length === 0 && (
        <p className="text-gray-400">
          No DLP events yet. Send some traffic through the proxy.
        </p>
      )}
      {events.map((ev) => (
        <div
          key={ev.id}
          className="border rounded-lg p-3 bg-white shadow-sm flex gap-4 items-start"
        >
          <div className="text-xs text-gray-400 w-36 shrink-0">
            {ev.ts
              ? new Date(ev.ts).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "—"}
          </div>
          <div className="flex-1">
            <div className="flex gap-2 items-center mb-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${ACTION_COLORS[ev.action] ?? ""}`}
              >
                {ev.action.toUpperCase()}
              </span>
              <span className="text-sm font-mono text-gray-700">{ev.path}</span>
              <span className="text-xs text-gray-400">{ev.direction}</span>
            </div>
            <div className="text-xs text-gray-500">
              {ev.matchedRules.join(" · ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
