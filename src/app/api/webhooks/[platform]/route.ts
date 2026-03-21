import { after } from "next/server";

import { getBotInstance } from "@/lib/bot";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/webhooks/[platform]">,
) {
  const { platform } = await context.params;

  return Response.json({
    ok: true,
    platform,
    message: "POST Slack events to this endpoint.",
  });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/webhooks/[platform]">,
) {
  const { platform } = await context.params;

  if (platform === "slack") {
    try {
      const payload = await request.clone().json();
      if (payload?.type === "url_verification" && payload?.challenge) {
        return new Response(payload.challenge, {
          headers: { "content-type": "text/plain" },
        });
      }
    } catch {
      // Ignore non-JSON payloads and continue to adapter handling.
    }
  }

  const { bot, missing } = getBotInstance();

  if (!bot) {
    return Response.json(
      {
        ok: false,
        error: "Missing required environment variables",
        missing,
      },
      { status: 500 },
    );
  }

  const handler = bot.webhooks[platform as keyof typeof bot.webhooks];

  if (!handler) {
    return new Response(`Unknown platform: ${platform}`, { status: 404 });
  }

  return handler(request, {
    waitUntil: (task) => after(() => task),
  });
}
