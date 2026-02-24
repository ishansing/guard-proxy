import { createMiddleware } from "hono/factory";
import { redact } from "../utils/redact";
import { mlRedact } from "../utils/mlRedact";
import { evaluatePolicy } from "../policies/engine";
import type { Variables } from "../types";

const ML_ENABLED = Bun.env.ML_ENABLED === "true";

async function runHybridScan(
  text: string,
  path: string,
  direction: "request" | "response",
): Promise<{ clean: string; blocked: boolean }> {
  // Pass 1: Regex
  const regexResult = redact(text);
  const hitPatternNames = regexResult.hits.map((h) => h.name);

  // Pass 2: ML
  let mlEntityTypes: string[] = [];
  let afterML = regexResult.clean;

  if (ML_ENABLED) {
    const mlResult = await mlRedact(regexResult.clean);
    mlEntityTypes = [
      ...mlResult.blocked.map((e) => e.entity_type),
      ...mlResult.flagged.map((e) => e.entity_type),
    ];
    afterML = mlResult.clean;
  }

  // Pass 3: Policy engine decision
  const decision = evaluatePolicy(
    mlEntityTypes,
    hitPatternNames,
    direction,
    text,
  );

  if (decision.matchedRules.length > 0) {
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "POLICY_DECISION",
        path,
        direction,
        action: decision.action,
        matchedRules: decision.matchedRules,
      }),
    );
  }

  // Apply policy action
  if (decision.action === "block") {
    return { clean: "[BLOCKED BY POLICY]", blocked: true };
  }

  return { clean: afterML, blocked: false };
}

export const dlpMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const contentType = c.req.header("content-type") ?? "";
    let cleanBody: string | undefined;

    if (
      contentType.includes("application/json") ||
      contentType.includes("text")
    ) {
      const body = await c.req.text();
      const { clean, blocked } = await runHybridScan(
        body,
        c.req.path,
        "request",
      );

      if (blocked) {
        return c.json({ error: "Request blocked by DLP policy" }, 403);
      }
      cleanBody = clean;
    }

    c.set("cleanBody", cleanBody);
    await next();

    const respContentType = c.res.headers.get("content-type") ?? "";
    if (
      respContentType.includes("application/json") ||
      respContentType.includes("text")
    ) {
      const respText = await c.res.text();
      const { clean } = await runHybridScan(respText, c.req.path, "response");

      c.res = new Response(clean, {
        status: c.res.status,
        headers: c.res.headers,
      });
    }
  },
);
