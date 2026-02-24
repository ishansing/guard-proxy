import type { Policy } from "../../types";

export const pciPolicy: Policy = {
  id: "pci",
  name: "PCI-DSS Compliance",
  description:
    "Payment Card Industry Data Security Standard — cardholder data protection",
  enabled: false,
  rules: [
    {
      name: "Block Credit Card Numbers (PAN)",
      description: "Primary Account Numbers must never leak",
      action: "redact",
      direction: "both",
      entityTypes: ["CREDIT_CARD"],
      patternNames: ["CREDIT_CARD"],
      severity: "critical",
      enabled: true,
    },
    {
      name: "Block CVV Codes",
      description: "Card validation codes must never be stored or transmitted",
      action: "block",
      direction: "both",
      entityTypes: [],
      patternNames: [],
      severity: "critical",
      enabled: true,
    },
    {
      name: "Redact Cardholder Name",
      description: "Cardholder names are protected CHD",
      action: "redact",
      direction: "both",
      entityTypes: ["PERSON"],
      patternNames: [],
      severity: "high",
      enabled: true,
    },
  ],
};
