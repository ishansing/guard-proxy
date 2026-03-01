import { Hono } from "hono";
import { proxy } from "hono/proxy";
import { requestLogger } from "./middleware/logger";
import { dlpMiddleware } from "./middleware/dlp";
import health from "./routes/health";
import type { Variables } from "./types";

import { prometheus } from "@hono/prometheus";

import dashboard from "./routes/dashboard";

export const app = new Hono<{ Variables: Variables }>(); // typed context

app.use("*", requestLogger);
app.use("*", dlpMiddleware);

app.route("/health", health);

app.route("/api", dashboard);

// Prometheus metrics
const { printMetrics, registerMetrics } = prometheus();
app.use("*", registerMetrics);
app.get("/metrics", printMetrics);

app.all("*", async (c, next) => {
  if (c.req.method === "CONNECT") return c.text("CONNECT not supported", 400);

  const urlObj = new URL(c.req.url);
  // If the path is /health or /api, it's an internal request
  if (c.req.path.startsWith("/health") || c.req.path.startsWith("/api")) {
    // Hono routes already handled it
    return await next();
  }

  const targetHost = urlObj.hostname;

  // 1. SSRF & Allowlist check
  const ALLOWED_TARGETS = (Bun.env.ALLOWED_TARGETS ?? "*")
    .split(",")
    .map((t) => t.trim());

  if (ALLOWED_TARGETS[0] !== "*" && !ALLOWED_TARGETS.includes(targetHost)) {
    return c.json({ error: "Forbidden: Target not in allowlist" }, 403);
  }

  // 2. Comprehensive Private IP / Internal Host Block
  const isInternal = (host: string) => {
    const internalPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^::1$/,
      /^fe80:/i,
    ];
    return internalPatterns.some((pw) => pw.test(host));
  };

  if (isInternal(targetHost)) {
    return c.json({ error: "Access to internal targets is blocked" }, 403);
  }

  // 3. Prepare headers (Fixing the Host header issue)
  const headers = new Headers(c.req.raw.headers);
  headers.set("Host", urlObj.host);
  // Remove proxy-specific headers that shouldn't leak upstream
  headers.delete("x-target-host");

  try {
    const res = await fetch(c.req.url, {
      method: c.req.method,
      headers,
      body: ["GET", "HEAD"].includes(c.req.method)
        ? undefined
        : c.get("cleanBody"),
      redirect: "manual", // Prevent proxy from following redirects automatically
    });

    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  } catch (err) {
    throw err; // Caught by app.onError
  }
});

app.onError((err, c) => {
  const isProd = Bun.env.NODE_ENV === "production";
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: "PROXY_ERROR",
      message: err.message,
      stack: isProd ? undefined : err.stack,
    }),
  );

  return c.json(
    {
      error: "Proxy error",
      message: isProd ? "An internal error occurred" : err.message,
    },
    500,
  );
});

export default {
  port: Number(Bun.env.PORT ?? 3000),
  idleTimeout: 0,
  fetch: app.fetch,
};
