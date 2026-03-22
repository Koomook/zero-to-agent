import { describe, expect, it, vi } from "vitest";

const { getSupabase } = vi.hoisted(() => ({
  getSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase,
}));

import { POST } from "./route";

describe("/api/submissions/[id]/review", () => {
  it("rejects invalid review statuses", async () => {
    const request = new Request("http://localhost/api/submissions/sub-1/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "sub-1" }),
    } as RouteContext<"/api/submissions/[id]/review">);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'status must be "ok" or "fail"',
    });
  });

  it("updates the review status and timestamp", async () => {
    vi.setSystemTime(new Date("2026-03-21T12:34:56.000Z"));

    const single = vi.fn().mockResolvedValue({
      data: { id: "sub-1", status: "ok" },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    getSupabase.mockReturnValue({ from });

    const request = new Request("http://localhost/api/submissions/sub-1/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "ok" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "sub-1" }),
    } as RouteContext<"/api/submissions/[id]/review">);

    expect(update).toHaveBeenCalledWith({
      status: "ok",
      reviewed_at: "2026-03-21T12:34:56.000Z",
    });
    expect(eq).toHaveBeenCalledWith("id", "sub-1");
    expect(await response.json()).toEqual({ id: "sub-1", status: "ok" });
  });
});
