import type { PresidioEntity } from "../types";

const PRESIDIO_URL = Bun.env.PRESIDIO_URL ?? "http://localhost:5002";
const BLOCK_THRESHOLD = Number(Bun.env.ML_CONFIDENCE_BLOCK ?? 0.8);
const FLAG_THRESHOLD = Number(Bun.env.ML_CONFIDENCE_FLAG ?? 0.6);

export interface MLRedactResult {
  clean: string;
  blocked: PresidioEntity[];
  flagged: PresidioEntity[];
  skipped: boolean; // true if Presidio was unreachable
}

export async function mlRedact(text: string): Promise<MLRedactResult> {
  // Skip empty or very short text
  if (!text || text.trim().length < 5) {
    return { clean: text, blocked: [], flagged: [], skipped: false };
  }

  let entities: PresidioEntity[] = [];

  try {
    const res = await fetch(`${PRESIDIO_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language: "en",
        score_threshold: FLAG_THRESHOLD, // get everything above flag threshold
      }),
      signal: AbortSignal.timeout(3000), // 3s timeout; fallback if slow
    });

    if (!res.ok) throw new Error(`Presidio returned ${res.status}`);
    entities = (await res.json()) as PresidioEntity[];
  } catch (err) {
    // Graceful fallback — Presidio down, regex-only mode continues
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "PRESIDIO_UNAVAILABLE",
        reason: (err as Error).message,
      }),
    );
    return { clean: text, blocked: [], flagged: [], skipped: true };
  }

  const blocked = entities.filter((e) => e.score >= BLOCK_THRESHOLD);
  const flagged = entities.filter(
    (e) => e.score >= FLAG_THRESHOLD && e.score < BLOCK_THRESHOLD,
  );

  // Redact from end to start to preserve string indices
  let clean = text;
  const toRedact = [...blocked].sort((a, b) => b.start - a.start);

  for (const entity of toRedact) {
    const isInsideQuotes =
      text[entity.start - 1] === '"' && text[entity.end] === '"';

    const replacement = isInsideQuotes
      ? `[REDACTED:${entity.entity_type}]`
      : `"[REDACTED:${entity.entity_type}]"`;

    clean =
      clean.slice(0, entity.start) + replacement + clean.slice(entity.end);
  }

  return { clean, blocked, flagged, skipped: false };
}
