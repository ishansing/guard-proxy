export interface AlertPayload {
  action: string;
  path: string;
  matchedRules: string[];
  direction: string;
  ts: string;
}

const SLACK_WEBHOOK = Bun.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK = Bun.env.DISCORD_WEBHOOK_URL;

const SEVERITY_EMOJI: Record<string, string> = {
  block: "🚨",
  redact: "⚠️",
  flag: "🚩",
  "log-only": "📝",
};

async function postWebhook(url: string, body: object, service: string) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: `${service.toUpperCase()}_ALERT_FAILED`,
        message: (err as Error).message,
      }),
    );
  }
}

export async function sendAlert(payload: AlertPayload) {
  // Only alert on block or redact actions
  if (!["block", "redact"].includes(payload.action)) return;

  const emoji = SEVERITY_EMOJI[payload.action] ?? "🔔";
  const message =
    `${emoji} *GuardProxy DLP Alert*\n` +
    `*Action:* ${payload.action.toUpperCase()}\n` +
    `*Path:* \`${payload.path}\`\n` +
    `*Direction:* ${payload.direction}\n` +
    `*Rules Matched:* ${payload.matchedRules.join(", ")}\n` +
    `*Time:* ${new Date(payload.ts).toLocaleString("en-IN")}`;

  const tasks: Promise<void>[] = [];

  if (SLACK_WEBHOOK) {
    tasks.push(postWebhook(SLACK_WEBHOOK, { text: message }, "slack"));
  }

  if (DISCORD_WEBHOOK) {
    tasks.push(postWebhook(DISCORD_WEBHOOK, { content: message }, "discord"));
  }

  // Fire both alerts in parallel
  await Promise.allSettled(tasks);
}
