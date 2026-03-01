import { useDLPEvents } from "../hooks/useDLPEvents";

const ACTION_STYLES: Record<string, string> = {
  block: "bg-red-900/50 text-red-300 border border-red-700",
  redact: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
  flag: "bg-blue-900/50 text-blue-300 border border-blue-700",
  "log-only": "bg-gray-800 text-gray-400 border border-gray-700",
  allow: "bg-green-900/50 text-green-300 border border-green-700",
};

export function EventFeed() {
  const events = useDLPEvents();

  // Group events by reqId to show one row per request
  const groupedEvents = events.reduce(
    (acc, ev) => {
      const id = ev.reqId || ev.id;
      if (!acc[id]) {
        acc[id] = { ...ev };
      } else {
        // Merge rules from request/response
        const existingRules = acc[id].matchedRules || [];
        const newRules = ev.matchedRules || [];
        acc[id].matchedRules = Array.from(
          new Set([...existingRules, ...newRules]),
        );
        // Prioritize more severe action (block > redact > flag)
        const priority = ["block", "redact", "flag", "log-only", "allow"];
        if (priority.indexOf(ev.action) < priority.indexOf(acc[id].action)) {
          acc[id].action = ev.action;
        }
      }
      return acc;
    },
    {} as Record<string, (typeof events)[0]>,
  );

  const displayEvents = Object.values(groupedEvents).sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
  );

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Live Traffic Feed
      </h2>
      {displayEvents.length === 0 && (
        <p className="text-gray-600 text-sm">
          Waiting for traffic... Send a request through port 3000.
        </p>
      )}
      {displayEvents.map((ev) => (
        <div
          key={ev.id}
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex gap-4 items-start hover:border-gray-600 transition"
        >
          {/* Timestamp */}
          <div className="text-xs text-gray-600 font-mono w-24 shrink-0 pt-0.5">
            {(() => {
              if (!ev.ts) return "—";
              const date = new Date(ev.ts);
              return !isNaN(date.getTime())
                ? date.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : ev.ts;
            })()}
          </div>

          {/* Action badge */}
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${ACTION_STYLES[ev.action] ?? ""}`}
          >
            {ev.action?.toUpperCase()}
          </span>

          {/* Path + direction */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-mono text-gray-200 truncate">
                {ev.path}
              </span>
              {/* No longer showing direction since it's grouped */}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {ev.matchedRules?.join(" · ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
