import { createMiddleware } from "hono/factory";
import { redact } from "../utils/redact";
import { mlRedact } from "../utils/mlRedact";
import { evaluatePolicy } from "../policies/engine";
import type { Variables } from "../types";

import { pushEvent } from "../store/events";
import { randomUUID } from "crypto";

const ML_ENABLED = Bun.env.ML_ENABLED === "true";
const MAX_PAYLOAD_SIZE = Number(Bun.env.MAX_PAYLOAD_SIZE ?? 1024 * 1024 * 5); // 5MB default

export async function runHybridScan(
  text: string,
  path: string,
  direction: "request" | "response",
  reqId: string,
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
    const ev = {
      id: randomUUID(),
      reqId,
      ts: new Date().toISOString(),
      event: "POLICY_DECISION",
      path,
      direction,
      action: decision.action,
      matchedRules: decision.matchedRules.map((m) => m.name),
      ruleMatches: decision.matchedRules,
      hits: regexResult.hits,
    };
    console.warn(JSON.stringify(ev));
    pushEvent(ev);
  }

  // Apply policy action
  if (decision.action === "block") {
    return { clean: "[BLOCKED BY POLICY]", blocked: true };
  }

  // If policy says redact, use the cleaned text (which includes Regex + ML redactions)
  // If policy says flag/log-only/allow, return original text to avoid unnecessary redaction (like dates)
  if (decision.action === "redact") {
    return { clean: afterML, blocked: false };
  }

  return { clean: text, blocked: false };
}

export const dlpMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    // Skip DLP for internal routes
    if (c.req.path.startsWith("/api/") || c.req.path.startsWith("/health")) {
      return await next();
    }

    const MAX_PAYLOAD_SIZE = Number(Bun.env.MAX_PAYLOAD_SIZE ?? 1024 * 1024 * 5); // 5MB default

    const reqId = randomUUID();
    const contentType = c.req.header("content-type") ?? "";
    const contentLength = Number(c.req.header("content-length") ?? 0);
    let cleanBody: string | undefined;

    // DoS Prevention: Check payload size before reading into memory
    if (contentLength > MAX_PAYLOAD_SIZE) {
      return c.json({ error: "Payload too large for DLP scanning" }, 413);
    }

    if (
      contentType.includes("application/json") ||
      contentType.includes("text")
    ) {
      const body = await c.req.text();
      const { clean, blocked } = await runHybridScan(
        body,
        c.req.path,
        "request",
        reqId,
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
      const { clean } = await runHybridScan(
        respText,
        c.req.path,
        "response",
        reqId,
      );

      c.res = new Response(clean, {
        status: c.res.status,
        headers: c.res.headers,
      });
    }
  },
);
