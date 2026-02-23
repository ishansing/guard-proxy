import { createMiddleware } from "hono/factory";

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req.raw;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      method,
      url,
      status,
      duration_ms: duration,
    }),
  );
});
