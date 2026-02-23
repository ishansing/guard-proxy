import { createMiddleware } from "hono/factory";
import { redact } from "../utils/redact";

export const dlpMiddleware = createMiddleware(async (c, next) => {
  // --- Scan REQUEST body ---
  const contentType = c.req.header("content-type") ?? "";
  let cleanBody: string | undefined;

  if (
    contentType.includes("application/json") ||
    contentType.includes("text")
  ) {
    const body = await c.req.text();
    const result = redact(body);

    if (result.wasModified) {
      console.warn(
        JSON.stringify({
          ts: new Date().toISOString(),
          event: "DLP_REQUEST_HIT",
          path: c.req.path,
          hits: result.hits,
        }),
      );
    }
    cleanBody = result.clean;
  }

  c.set("cleanBody", cleanBody);

  await next();

  // --- Scan RESPONSE body ---
  const respContentType = c.res.headers.get("content-type") ?? "";
  if (
    respContentType.includes("application/json") ||
    respContentType.includes("text")
  ) {
    const respText = await c.res.text();
    const result = redact(respText);

    if (result.wasModified) {
      console.warn(
        JSON.stringify({
          ts: new Date().toISOString(),
          event: "DLP_RESPONSE_HIT",
          path: c.req.path,
          hits: result.hits,
        }),
      );
    }

    c.res = new Response(result.clean, {
      status: c.res.status,
      headers: c.res.headers,
    });
  }
});
