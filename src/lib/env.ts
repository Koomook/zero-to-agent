const REQUIRED_ENV_VARS = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const PLATFORM_ENV_SETS = {
  slack: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"],
  telegram: ["TELEGRAM_BOT_TOKEN"],
  whatsapp: ["WHATSAPP_ACCESS_TOKEN"],
} as const;

export type BotRuntimeStatus = {
  missing: string[];
  platforms: string[];
  webhookPath: string;
};

export function getBotRuntimeStatus(): BotRuntimeStatus {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key]?.trim(),
  );

  const platforms: string[] = [];
  for (const [platform, vars] of Object.entries(PLATFORM_ENV_SETS)) {
    if (vars.every((v) => process.env[v]?.trim())) {
      platforms.push(platform);
    }
  }

  return {
    missing,
    platforms,
    webhookPath: "/api/webhooks",
  };
}

export function hasCompleteBotEnv() {
  const status = getBotRuntimeStatus();
  return status.missing.length === 0 && status.platforms.length > 0;
}
