import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { cors } from "hono/cors";
import { desc, count } from "drizzle-orm";
import { eventStore, subscribe } from "../store/events";
import { db, schema } from "../db";

const dashboard = new Hono();

dashboard.use("*", cors({ origin: "http://localhost:5173" }));

// Live SSE stream
dashboard.get("/events/stream", async (c) => {
  return streamSSE(c, async (stream) => {
    const unsubscribe = subscribe(async (ev) => {
      await stream.writeSSE({
        data: JSON.stringify(ev),
        event: "dlp-event",
        id: ev.id,
      });
    });

    stream.onAbort(unsubscribe);

    while (!stream.closed) {
      await stream.sleep(30000);
      await stream.writeSSE({ data: "ping", event: "heartbeat", id: "hb" });
    }

    unsubscribe();
  });
});

// In-memory events (fast)
dashboard.get("/events", (c) => c.json(eventStore));

// Historical events from PostgreSQL (survives restarts)
dashboard.get("/events/history", async (c) => {
  const rows = await db
    .select()
    .from(schema.dlpEvents)
    .orderBy(desc(schema.dlpEvents.createdAt))
    .limit(500);

  return c.json(rows);
});

// Persistent stats from PostgreSQL
dashboard.get("/stats", async (c) => {
  const [totalRes] = await db.select({ value: count() }).from(schema.dlpEvents);
  const total = Number(totalRes.value);

  const byActionRes = await db
    .select({
      action: schema.dlpEvents.action,
      value: count(),
    })
    .from(schema.dlpEvents)
    .groupBy(schema.dlpEvents.action);

  const byAction = byActionRes.reduce(
    (acc, row) => {
      acc[row.action] = Number(row.value);
      return acc;
    },
    {} as Record<string, number>,
  );

  return c.json({ total, byAction });
});

// Active policies
dashboard.get("/policies", (c) => {
  const { getActivePolicies } = require("../policies/engine");
  return c.json(getActivePolicies());
});

export default dashboard;
