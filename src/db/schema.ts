import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";

export const dlpEvents = pgTable("dlp_events", {
  id: text("id").primaryKey(),
  reqId: text("req_id"),
  ts: text("ts").notNull(),
  event: text("event").notNull(),
  path: text("path").notNull(),
  direction: text("direction").notNull(),
  action: text("action").notNull(),
  matchedRules: jsonb("matched_rules").notNull().$type<string[]>(),
  hits: jsonb("hits").$type<object[]>(),
  sourceIp: text("source_ip"),
  method: text("method"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DLPEventRow = typeof dlpEvents.$inferInsert;
