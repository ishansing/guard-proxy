export interface DLPEvent {
  id: string;
  reqId?: string; // Links request and response
  ts: string;
  event: string;
  path: string;
  direction: "request" | "response";
  action: string;
  matchedRules: string[];
  ruleMatches?: { name: string; action: string }[];
  hits?: { name: string; severity: string; count: number }[];
}

// In-memory ring buffer — last 500 events
const MAX_EVENTS = 500;
export const eventStore: DLPEvent[] = [];

// SSE subscribers
type Subscriber = (event: DLPEvent) => void;
const subscribers = new Set<Subscriber>();

export function pushEvent(event: DLPEvent) {
  eventStore.push(event);
  if (eventStore.length > MAX_EVENTS) eventStore.shift();
  // Broadcast to all SSE clients
  subscribers.forEach((fn) => fn(event));
}

export function subscribe(fn: Subscriber) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
