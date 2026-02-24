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
      description: "CVV only triggers near credit cards (proximity)",
      action: "block",
      direction: "both",
      entityTypes: ["CREDIT_CARD"], // ML credit card nearby
      patternNames: ["CVV_CODE", "CREDIT_CARD"], // regex nearby
      proximityDistance: 50, // within 50 chars of card number
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
