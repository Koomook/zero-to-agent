import { describe, expect, it, vi } from "vitest";

const { getSupabase } = vi.hoisted(() => ({
  getSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase,
}));

import { GET } from "./route";

describe("/api/submissions", () => {
  it("returns submissions in reverse chronological order", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "submission-1" }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });

    getSupabase.mockReturnValue({ from });

    const response = await GET();

    expect(from).toHaveBeenCalledWith("task_submissions");
    expect(select).toHaveBeenCalledWith(
      "*, task:tasks(id, title, text_guide, expected_image_url)",
    );
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(await response.json()).toEqual([{ id: "submission-1" }]);
  });
});
