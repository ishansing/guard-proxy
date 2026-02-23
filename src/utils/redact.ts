import { DLP_PATTERNS } from "../config/patterns";

export interface RedactResult {
  clean: string;
  hits: { name: string; severity: string; count: number }[];
  wasModified: boolean;
}

export function redact(text: string): RedactResult {
  let clean = text;
  const hits: RedactResult["hits"] = [];

  for (const { name, pattern, severity } of DLP_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = clean.match(pattern);
    if (matches) {
      hits.push({ name, severity, count: matches.length });
      pattern.lastIndex = 0;
      clean = clean.replace(pattern, `[REDACTED:${name}]`);
    }
    pattern.lastIndex = 0;
  }

  return {
    clean,
    hits,
    wasModified: hits.length > 0,
  };
}
