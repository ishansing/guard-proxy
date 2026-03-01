import type { Policy } from "../../types";

export const gdprPolicy: Policy = {
  id: "gdpr",
  name: "GDPR Compliance",
  description:
    "EU General Data Protection Regulation — Article 9 special categories",
  enabled: true, // opt-in
  rules: [
    {
      name: "Redact Personal Names",
      description: "Names are directly identifying under GDPR",
      action: "redact",
      direction: "both",
      entityTypes: ["PERSON"],
      patternNames: [],
      severity: "high",
      enabled: true,
    },
    {
      name: "Redact Location Data",
      description: "Addresses and locations are PII under GDPR",
      action: "redact",
      direction: "both",
      entityTypes: ["LOCATION"],
      patternNames: [],
      severity: "high",
      enabled: true,
    },
    {
      name: "Redact National IDs",
      description: "Government-issued IDs and passport numbers",
      action: "redact",
      direction: "both",
      entityTypes: ["NRP", "ID"],
      patternNames: ["SSN"],
      severity: "critical",
      enabled: true,
    },
    {
      name: "Redact IP Addresses",
      description: "IPs are personal data under GDPR",
      action: "redact",
      direction: "both",
      entityTypes: ["IP_ADDRESS"],
      patternNames: ["IPV4"],
      severity: "medium",
      enabled: true,
    },
    {
      name: "Redact Phone Numbers",
      description: "Phone numbers are direct PII identifiers",
      action: "redact",
      direction: "both",
      entityTypes: ["PHONE_NUMBER"],
      patternNames: ["PHONE"],
      severity: "high",
      enabled: true,
    },
  ],
};
