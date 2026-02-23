import { Hono } from "hono";
import { proxy } from "hono/proxy";
import { requestLogger } from "./middleware/logger";
import { dlpMiddleware } from "./middleware/dlp";
import health from "./routes/health";
import type { Variables } from "./types";

const app = new Hono<{ Variables: Variables }>(); // ✅ typed context

app.use("*", requestLogger);
app.use("*", dlpMiddleware);

app.route("/health", health);

app.all("*", async (c) => {
  const targetHost =
    c.req.header("x-target-host") ??
    new URL(Bun.env.PROXY_TARGET ?? "https://httpbin.org").host;

  const targetUrl = `https://${targetHost}${c.req.path}${
    c.req.url.includes("?") ? "?" + c.req.url.split("?")[1] : ""
  }`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("host", targetHost);
  headers.delete("x-target-host");

  return proxy(targetUrl, {
    method: c.req.method,
    headers,
    body: c.get("cleanBody"),
  });
});

app.onError((err, c) => {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: "ERROR",
      message: err.message,
    }),
  );
  return c.json({ error: "Proxy error", message: err.message }, 500);
});

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
