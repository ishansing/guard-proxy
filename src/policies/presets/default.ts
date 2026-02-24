import type { Policy } from "../../types";

export const defaultPolicy: Policy = {
  id: "default",
  name: "Default Protection",
  description: "Baseline PII protection for all traffic",
  enabled: true,
  rules: [
    {
      name: "Block API Keys",
      description: "Redact leaked API keys and tokens",
      action: "redact",
      direction: "both",
      entityTypes: [],
      patternNames: ["API_KEY"],
      severity: "critical",
      enabled: true,
    },
    {
      name: "Redact Passwords",
      description: "Redact password fields in request bodies",
      action: "redact",
      direction: "request",
      entityTypes: [],
      patternNames: ["PASSWORD_FIELD"],
      severity: "critical",
      enabled: true,
    },
    {
      name: "Flag Emails",
      description: "Log and flag outgoing email addresses",
      action: "flag",
      direction: "both",
      entityTypes: ["EMAIL_ADDRESS"],
      patternNames: ["EMAIL"],
      severity: "medium",
      enabled: true,
    },
  ],
};
