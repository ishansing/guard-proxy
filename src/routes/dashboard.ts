import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { cors } from "hono/cors";
import { eventStore, subscribe } from "../store/events";
import { getActivePolicies } from "../policies/engine";

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
    stream.onAbort(() => { unsubscribe(); });

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
  const reqIds = new Set(eventStore.map((e) => e.reqId || e.id));
  const total = reqIds.size;
  const byAction: Record<string, number> = {};

  for (const ev of eventStore) {
    // If we have granular rule matches, count each one
    if (ev.ruleMatches && ev.ruleMatches.length > 0) {
      for (const match of ev.ruleMatches) {
        byAction[match.action] = (byAction[match.action] ?? 0) + 1;
      }
    } else {
      // Fallback to the top-level action if ruleMatches is missing
      byAction[ev.action] = (byAction[ev.action] ?? 0) + 1;
    }
  }

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
  return c.json(getActivePolicies());
});

export default dashboard;
