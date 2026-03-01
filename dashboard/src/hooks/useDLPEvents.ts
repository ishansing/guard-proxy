import { useEffect, useState, useRef } from "react";
import type { DLPEvent } from "../../../src/store/events";

export function useDLPEvents() {
  const [events, setEvents] = useState<DLPEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: DLPEvent[]) => setEvents(data));

    function connect() {
      const es = new EventSource("/api/events/stream");
      esRef.current = es;

      es.addEventListener("dlp-event", (e) => {
        const ev: DLPEvent = JSON.parse((e as MessageEvent).data);
        setEvents((prev) => [ev, ...prev].slice(0, 500));
      });

      // Auto-reconnect on error
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
