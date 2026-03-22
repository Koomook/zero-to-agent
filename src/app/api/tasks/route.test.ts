import { describe, expect, it, vi } from "vitest";

const { getSupabase } = vi.hoisted(() => ({
  getSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase,
}));

import { GET, POST } from "./route";

describe("/api/tasks", () => {
  it("returns tasks ordered by sort_order", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "task-1" }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });

    getSupabase.mockReturnValue({ from });

    const response = await GET();

    expect(from).toHaveBeenCalledWith("tasks");
    expect(select).toHaveBeenCalledWith("*, task_list:task_lists(name)");
    expect(order).toHaveBeenCalledWith("sort_order", { ascending: true });
    expect(await response.json()).toEqual([{ id: "task-1" }]);
  });

  it("creates a task from the posted payload", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "task-1", title: "Restock" },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    getSupabase.mockReturnValue({ from });

    const request = new Request("http://localhost/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task_list_id: "list-1",
        title: "Restock",
        text_guide: "Face labels forward",
        expected_image_url: "https://example.com/expected.jpg",
        sort_order: 2,
      }),
    });

    const response = await POST(request);

    expect(insert).toHaveBeenCalledWith({
      task_list_id: "list-1",
      title: "Restock",
      text_guide: "Face labels forward",
      expected_image_url: "https://example.com/expected.jpg",
      sort_order: 2,
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "task-1", title: "Restock" });
  });
});
