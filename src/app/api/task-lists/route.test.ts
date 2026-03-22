import { describe, expect, it, vi } from "vitest";

const { getSupabase } = vi.hoisted(() => ({
  getSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase,
}));

import { GET, POST } from "./route";

describe("/api/task-lists", () => {
  it("returns task lists with counts", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "list-1", name: "Checklist" }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });

    getSupabase.mockReturnValue({ from });

    const response = await GET();

    expect(from).toHaveBeenCalledWith("task_lists");
    expect(select).toHaveBeenCalledWith("*, tasks(count)");
    expect(await response.json()).toEqual([{ id: "list-1", name: "Checklist" }]);
  });

  it("creates a task list", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "list-1", name: "Checklist" },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    getSupabase.mockReturnValue({ from });

    const request = new Request("http://localhost/api/task-lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Checklist" }),
    });

    const response = await POST(request);

    expect(insert).toHaveBeenCalledWith({ name: "Checklist" });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "list-1", name: "Checklist" });
  });
});
