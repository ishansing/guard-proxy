import { Hono } from "hono";

const health = new Hono();

health.get("/", (c) =>
  c.json({
    status: "ok",
    service: "guard-proxy",
    version: "1.0.0",
    ts: new Date().toISOString(),
  }),
);

export default health;
