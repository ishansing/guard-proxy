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
  {
    name: "CVV_CODE",
    // handles JSON format "cvv":123 and "cvv": 123
    pattern:
      /(?:"(?:cvv|cvv2|cvc|cid)"\s*:\s*\d{3,4})|(?:\b(?:cvv|cvv2|cvc|cid)[\s:=]*\d{3,4}\b)/gi,
    severity: "critical",
  },
];

export const CVV_WHITELIST = [
  "100",
  "101",
  "102", // HTTP status codes
  "200",
  "201",
  "404",
  "500", // HTTP codes
  "5000",
  "10000", // common amounts
];

export function isSafeCVV(match: string, context: string): boolean {
  const num = match.trim();
  if (CVV_WHITELIST.includes(num)) return true;

  // Check context for safe words
  const safeContext = /\b(?:price|amount|quantity|code|id|status)\b/i.test(
    context,
  );
  return safeContext;
}
