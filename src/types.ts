export type Variables = {
  cleanBody: string | undefined;
};

// Presidio API response shape
export interface PresidioEntity {
  entity_type: string;
  start: number;
  end: number;
  score: number;
}

// Policy types
export type PolicyAction = "block" | "redact" | "flag" | "log-only" | "allow";

export type PolicyDirection = "request" | "response" | "both";

export interface PolicyRule {
  name: string;
  description: string;
  action: PolicyAction;
  direction: PolicyDirection;
  entityTypes: string[]; // Presidio entity types to match
  patternNames?: string[]; // Regex pattern names to match (from patterns.ts)
  proximityDistance?: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  enabled: boolean;
}
