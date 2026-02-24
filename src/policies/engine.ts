import type { Policy, PolicyRule, PolicyAction } from "../types";
import { defaultPolicy } from "./presets/default";
import { gdprPolicy } from "./presets/gdpr";
import { hipaaPolicy } from "./presets/hipaa";
import { pciPolicy } from "./presets/pci";
import { CVV_WHITELIST } from "../config/patterns";

const ALL_POLICIES: Policy[] = [
  defaultPolicy,
  gdprPolicy,
  hipaaPolicy,
  pciPolicy,
];

const activePolicyIds = (Bun.env.ACTIVE_POLICIES ?? "default")
  .split(",")
  .map((p) => p.trim());

export function getActivePolicies(): Policy[] {
  return ALL_POLICIES.filter(
    (p) => activePolicyIds.includes(p.id) && p.enabled,
  );
}

// Define priority order
const priority: PolicyAction[] = [
  "block",
  "redact",
  "flag",
  "log-only",
  "allow",
];

// Define isSafeCVV
function isSafeCVV(context: string): boolean {
  const safeContextWords =
    /\b(?:price|amount|quantity|code|id|status|error|count|total)\b/i;
  const hasWhitelistNum = CVV_WHITELIST.some((n) => context.includes(n));
  return safeContextWords.test(context) || hasWhitelistNum;
}

// Define checkProximity
function checkProximity(
  entityTypes: string[],
  patternNames: string[],
  context: string,
  distance: number,
): boolean {
  // Check if a credit card number appears within `distance` chars of a CVV pattern
  const cardPattern = /\b(?:\d[ -]?){13,16}\b/;
  const cvvPattern = /\b(?:cvv|cvv2|cvc|cid)[\s:]*\d{3,4}\b/i;

  const cardMatch = cardPattern.exec(context);
  const cvvMatch = cvvPattern.exec(context);

  if (!cardMatch || !cvvMatch) return false;

  return Math.abs(cardMatch.index - cvvMatch.index) <= distance;
}

export interface PolicyDecision {
  action: PolicyAction;
  matchedRules: string[];
}

export function evaluatePolicy(
  entityTypes: string[],
  patternNames: string[],
  direction: "request" | "response",
  context: string,
): PolicyDecision {
  const matchedRules: string[] = [];
  let finalAction: PolicyAction = "allow";

  for (const policy of getActivePolicies()) {
    for (const rule of policy.rules) {
      if (!rule.enabled) continue;
      if (rule.direction !== "both" && rule.direction !== direction) continue;

      // Proximity check
      const hasProximity = (rule as any).proximityDistance
        ? checkProximity(
            entityTypes,
            patternNames,
            context,
            (rule as any).proximityDistance,
          )
        : true;

      // CVV whitelist check
      const cvvSafe = patternNames.includes("CVV_CODE") && isSafeCVV(context);

      const matchesEntity = rule.entityTypes.some((e) =>
        entityTypes.includes(e),
      );
      const matchesPattern = (rule.patternNames ?? []).some((p) =>
        patternNames.includes(p),
      );
      const matches =
        (matchesEntity || matchesPattern) && hasProximity && !cvvSafe;

      if (matches) {
        matchedRules.push(`[${policy.name}] ${rule.name}`);
        if (priority.indexOf(rule.action) < priority.indexOf(finalAction)) {
          finalAction = rule.action;
        }
      }
    }
  }

  return { action: finalAction, matchedRules };
}
