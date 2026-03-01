import { db, schema } from "../db";
import { sendAlert } from "../utils/alerts";

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

// In-memory ring buffer — last 500 events for SSE
const MAX_EVENTS = 500;
export const eventStore: DLPEvent[] = [];

type Subscriber = (event: DLPEvent) => void;
const subscribers = new Set<Subscriber>();

export async function pushEvent(event: DLPEvent) {
  // 1. In-memory store for SSE
  eventStore.push(event);
  if (eventStore.length > MAX_EVENTS) eventStore.shift();

  // 2. Broadcast to live SSE clients
  subscribers.forEach((fn) => fn(event));

  // 3. Persist to PostgreSQL (non-blocking)
  db.insert(schema.dlpEvents)
    .values({
      id: event.id,
      reqId: event.reqId,
      ts: event.ts,
      event: event.event,
      path: event.path,
      direction: event.direction,
      action: event.action,
      matchedRules: event.matchedRules,
      hits: event.hits ?? [],
      method: "POST",
    })
    .catch((err: Error) => {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          event: "DB_INSERT_FAILED",
          message: err.message,
        }),
      );
    });

  // 4. Send webhook alert (non-blocking)
  sendAlert({
    action: event.action,
    path: event.path,
    matchedRules: event.matchedRules,
    direction: event.direction,
    ts: event.ts,
  }).catch(() => {});
}

export function subscribe(fn: Subscriber) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
