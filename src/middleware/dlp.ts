import { createMiddleware } from "hono/factory";
import { redact } from "../utils/redact";
import { mlRedact } from "../utils/mlRedact";
import type { Variables } from "../types";

const ML_ENABLED = Bun.env.ML_ENABLED === "true";

async function runHybridScan(
  text: string,
  path: string,
  direction: "REQUEST" | "RESPONSE",
) {
  // --- Pass 1: Regex (fast, structured PII) ---
  const regexResult = redact(text);

  if (regexResult.wasModified) {
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: `DLP_REGEX_HIT_${direction}`,
        path,
        hits: regexResult.hits,
      }),
    );
  }

  // --- Pass 2: ML/NER (context-aware, freeform PII) ---
  if (!ML_ENABLED) return regexResult.clean;

  const mlResult = await mlRedact(regexResult.clean);

  if (mlResult.skipped) {
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "ML_FALLBACK_REGEX_ONLY",
        path,
      }),
    );
    return regexResult.clean;
  }

  if (mlResult.blocked.length > 0) {
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: `DLP_ML_BLOCKED_${direction}`,
        path,
        entities: mlResult.blocked.map((e) => ({
          type: e.entity_type,
          score: e.score,
        })),
      }),
    );
  }

  if (mlResult.flagged.length > 0) {
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: `DLP_ML_FLAGGED_${direction}`,
        path,
        entities: mlResult.flagged.map((e) => ({
          type: e.entity_type,
          score: e.score,
        })),
      }),
    );
  }

  return mlResult.clean;
}

export const dlpMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    // --- Scan REQUEST ---
    const contentType = c.req.header("content-type") ?? "";
    let cleanBody: string | undefined;

    if (
      contentType.includes("application/json") ||
      contentType.includes("text")
    ) {
      const body = await c.req.text();
      cleanBody = await runHybridScan(body, c.req.path, "REQUEST");
    }

    c.set("cleanBody", cleanBody);
    await next();

    // --- Scan RESPONSE ---
    const respContentType = c.res.headers.get("content-type") ?? "";
    if (
      respContentType.includes("application/json") ||
      respContentType.includes("text")
    ) {
      const respText = await c.res.text();
      const cleanResp = await runHybridScan(respText, c.req.path, "RESPONSE");

      c.res = new Response(cleanResp, {
        status: c.res.status,
        headers: c.res.headers,
      });
    }
  },
);
