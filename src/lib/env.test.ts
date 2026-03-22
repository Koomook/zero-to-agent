import { describe, expect, it } from "vitest";

import { getBotRuntimeStatus, hasCompleteBotEnv } from "@/lib/env";

describe("env", () => {
  it("reports missing core variables and no active platforms", () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_SIGNING_SECRET;

    expect(getBotRuntimeStatus()).toEqual({
      missing: [
        "GOOGLE_GENERATIVE_AI_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
      platforms: [],
      webhookPath: "/api/webhooks",
    });
    expect(hasCompleteBotEnv()).toBe(false);
  });

  it("reports ready status when core env and one platform are configured", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.SLACK_BOT_TOKEN = "xoxb-token";
    process.env.SLACK_SIGNING_SECRET = "secret";

    expect(getBotRuntimeStatus()).toEqual({
      missing: [],
      platforms: ["slack"],
      webhookPath: "/api/webhooks",
    });
    expect(hasCompleteBotEnv()).toBe(true);
  });

  it("detects multiple configured platforms", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.SLACK_BOT_TOKEN = "xoxb-token";
    process.env.SLACK_SIGNING_SECRET = "secret";
    process.env.TELEGRAM_BOT_TOKEN = "telegram";
    process.env.WHATSAPP_ACCESS_TOKEN = "whatsapp";

    expect(getBotRuntimeStatus().platforms).toEqual([
      "slack",
      "telegram",
      "whatsapp",
    ]);
  });
});
