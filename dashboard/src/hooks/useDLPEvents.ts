import { useEffect, useState, useRef } from "react";

export interface DLPEvent {
  id: string;
  reqId?: string;
  ts: string;
  event: string;
  path: string;
  direction: "request" | "response";
  action: string;
  matchedRules: string[];
  hits?: { name: string; severity: string; count: number }[];
}

export function useDLPEvents() {
  const [events, setEvents] = useState<DLPEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Load persisted events from PostgreSQL on startup
    fetch("/api/events/history")
      .then((r) => r.json())
      .then((data: DLPEvent[]) => {
        // DB returns newest first (desc order) — already correct
        setEvents(data);
      })
      .catch(console.error);

    // Then subscribe to live SSE for new events
    function connect() {
      const es = new EventSource("/api/events/stream");
      esRef.current = es;

      es.addEventListener("dlp-event", (e) => {
        const ev: DLPEvent = JSON.parse(e.data);
        setEvents((prev) => {
          // Avoid duplicates (SSE might replay events already in DB)
          if (prev.some((p) => p.id === ev.id)) return prev;
          return [ev, ...prev].slice(0, 500);
        });
      });

      es.onerror = () => {
        es.close();
        setTimeout(connect, 3000);
      };
    }

    connect();
    return () => esRef.current?.close();
  }, []);

  return events;
}
