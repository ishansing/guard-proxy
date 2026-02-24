import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { cors } from "hono/cors";
import { eventStore, subscribe } from "../store/events";

const dashboard = new Hono();

// Allow React dev server to call API
dashboard.use("*", cors({ origin: "http://localhost:5173" }));

// GET all recent events (initial load)
dashboard.get("/events", (c) => {
  return c.json(eventStore);
});

// SSE stream — push new events to dashboard in real time
dashboard.get("/events/stream", async (c) => {
  return streamSSE(c, async (stream) => {
    // Send existing events first
    for (const ev of eventStore) {
      await stream.writeSSE({
        data: JSON.stringify(ev),
        event: "dlp-event",
        id: ev.id,
      });
    }

    // Subscribe to new events
    const unsubscribe = subscribe(async (ev) => {
      await stream.writeSSE({
        data: JSON.stringify(ev),
        event: "dlp-event",
        id: ev.id,
      });
    });

    // Clean up on disconnect
    stream.onAbort(unsubscribe);

    // Keep connection alive
    while (!stream.closed) {
      await stream.sleep(30000);
      await stream.writeSSE({ data: "ping", event: "heartbeat", id: "hb" });
    }

    unsubscribe();
  });
});

// GET stats summary
dashboard.get("/stats", (c) => {
  const total = eventStore.length;
  const byAction = eventStore.reduce(
    (acc, e) => {
      acc[e.action] = (acc[e.action] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const byRule = eventStore
    .flatMap((e) => e.matchedRules)
    .reduce(
      (acc, r) => {
        acc[r] = (acc[r] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

  return c.json({ total, byAction, byRule });
});

// GET active policies
dashboard.get("/policies", (c) => {
  const { getActivePolicies } = require("../policies/engine");
  return c.json(getActivePolicies());
});

export default dashboard;
