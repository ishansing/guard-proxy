export interface DLPPattern {
  name: string;
  pattern: RegExp;
  severity: "low" | "medium" | "high" | "critical";
}

export const DLP_PATTERNS: DLPPattern[] = [
  {
    name: "SSN",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: "critical",
  },
  {
    name: "EMAIL",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    severity: "medium",
  },
  {
    name: "CREDIT_CARD",
    pattern: /\b(?:\d[ -]?){13,16}\b/g,
    severity: "critical",
  },
  {
    name: "API_KEY",
    pattern: /\b(sk|pk|api|token)[_-]?[a-zA-Z0-9]{20,}\b/gi,
    severity: "critical",
  },
  {
    name: "PHONE",
    pattern: /\b(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g,
    severity: "medium",
  },
  {
    name: "IPV4",
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    severity: "low",
  },
  {
    name: "PASSWORD_FIELD",
    pattern: /("password"\s*:\s*"[^"]+"|password=[^&\s]+)/gi,
    severity: "critical",
  },
];
