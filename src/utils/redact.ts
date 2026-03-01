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
      // If the pattern has capturing groups, we might want to preserve group 1 (the key)
      // and only redact the rest.
      clean = clean.replace(pattern, (match, p1) => {
        if (p1 && match.startsWith(p1)) {
          return `${p1}"[REDACTED:${name}]"`;
        }
        return `[REDACTED:${name}]`;
      });
    }
    pattern.lastIndex = 0;
  }

  return {
    clean,
    hits,
    wasModified: hits.length > 0,
  };
}
