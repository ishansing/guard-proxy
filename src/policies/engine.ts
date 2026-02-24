import type { Policy, PolicyRule, PolicyAction } from "../types";
import { defaultPolicy } from "./presets/default";
import { gdprPolicy } from "./presets/gdpr";
import { hipaaPolicy } from "./presets/hipaa";
import { pciPolicy } from "./presets/pci";

// All registered policies
const ALL_POLICIES: Policy[] = [
  defaultPolicy,
  gdprPolicy,
  hipaaPolicy,
  pciPolicy,
];

// Activate policies via .env: ACTIVE_POLICIES=default,gdpr
const activePolicyIds = (Bun.env.ACTIVE_POLICIES ?? "default")
  .split(",")
  .map((p) => p.trim());

export function getActivePolicies(): Policy[] {
  return ALL_POLICIES.filter(
    (p) => activePolicyIds.includes(p.id) && p.enabled,
  );
}

export interface PolicyDecision {
  action: PolicyAction;
  matchedRules: string[];
}

export function evaluatePolicy(
  entityTypes: string[],
  patternNames: string[],
  direction: "request" | "response",
): PolicyDecision {
  const matchedRules: string[] = [];
  let finalAction: PolicyAction = "allow";

  // Priority order: block > redact > flag > log-only > allow
  const priority: PolicyAction[] = [
    "block",
    "redact",
    "flag",
    "log-only",
    "allow",
  ];

  for (const policy of getActivePolicies()) {
    for (const rule of policy.rules) {
      if (!rule.enabled) continue;
      if (rule.direction !== "both" && rule.direction !== direction) continue;

      const matchesEntity = rule.entityTypes.some((e) =>
        entityTypes.includes(e),
      );
      const matchesPattern = (rule.patternNames ?? []).some((p) =>
        patternNames.includes(p),
      );

      if (matchesEntity || matchesPattern) {
        matchedRules.push(`[${policy.name}] ${rule.name}`);
        // Escalate action if higher priority
        if (priority.indexOf(rule.action) < priority.indexOf(finalAction)) {
          finalAction = rule.action;
        }
      }
    }
  }

  return { action: finalAction, matchedRules };
}
