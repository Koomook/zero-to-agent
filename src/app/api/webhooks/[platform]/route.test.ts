import { describe, expect, it, vi } from "vitest";

const { after, getBotInstance } = vi.hoisted(() => ({
  after: vi.fn((callback: () => Promise<unknown>) => callback()),
  getBotInstance: vi.fn(),
}));

vi.mock("next/server", () => ({
  after,
}));

vi.mock("@/lib/bot", () => ({
  getBotInstance,
}));

import { GET, POST } from "./route";

describe("/api/webhooks/[platform]", () => {
  it("returns platform info for GET requests", async () => {
    const response = await GET(
      new Request("http://localhost/api/webhooks/slack"),
      {
        params: Promise.resolve({ platform: "slack" }),
      } as RouteContext<"/api/webhooks/[platform]">,
    );

    expect(await response.json()).toEqual({
      ok: true,
      platform: "slack",
      message: "POST Slack events to this endpoint.",
    });
  });

  it("handles Slack URL verification without booting the bot", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/slack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "url_verification",
          challenge: "challenge-token",
        }),
      }),
      {
        params: Promise.resolve({ platform: "slack" }),
      } as RouteContext<"/api/webhooks/[platform]">,
    );

    expect(getBotInstance).not.toHaveBeenCalled();
    expect(await response.text()).toBe("challenge-token");
  });

  it("returns 500 when the bot cannot boot", async () => {
    getBotInstance.mockReturnValue({
      bot: null,
      missing: ["SLACK_BOT_TOKEN"],
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/slack", { method: "POST" }),
      {
        params: Promise.resolve({ platform: "slack" }),
      } as RouteContext<"/api/webhooks/[platform]">,
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Missing required environment variables",
      missing: ["SLACK_BOT_TOKEN"],
    });
  });

  it("returns 404 for unknown platforms", async () => {
    getBotInstance.mockReturnValue({
      bot: {
        webhooks: {},
      },
      missing: [],
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/discord", { method: "POST" }),
      {
        params: Promise.resolve({ platform: "discord" }),
      } as RouteContext<"/api/webhooks/[platform]">,
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Unknown platform: discord");
  });

  it("delegates to the platform webhook handler", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok"));
    getBotInstance.mockReturnValue({
      bot: {
        webhooks: {
          telegram: handler,
        },
      },
      missing: [],
    });

    const request = new Request("http://localhost/api/webhooks/telegram", {
      method: "POST",
      body: "payload",
    });

    const response = await POST(
      request,
      {
        params: Promise.resolve({ platform: "telegram" }),
      } as RouteContext<"/api/webhooks/[platform]">,
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBe(request);
    expect(typeof handler.mock.calls[0][1].waitUntil).toBe("function");
    await handler.mock.calls[0][1].waitUntil(Promise.resolve("done"));
    expect(after).toHaveBeenCalled();
    expect(await response.text()).toBe("ok");
  });
});
