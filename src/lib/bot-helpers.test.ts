import { describe, expect, it } from "vitest";

import {
  formatEvaluation,
  formatTaskPrompt,
  getExtensionFromMimeType,
  getFirstImageAttachment,
  hasImageAttachment,
  pickNextPendingTask,
} from "@/lib/bot-helpers";
import type { Task } from "@/lib/types";

const TASKS: Task[] = [
  {
    id: "task-1",
    task_list_id: "list-1",
    title: "First",
    text_guide: "Keep it tidy",
    expected_image_url: null,
    sort_order: 1,
    created_at: "2026-03-21T00:00:00.000Z",
  },
  {
    id: "task-2",
    task_list_id: "list-1",
    title: "Second",
    text_guide: null,
    expected_image_url: null,
    sort_order: 2,
    created_at: "2026-03-21T00:00:00.000Z",
  },
];

describe("bot helpers", () => {
  it("detects image attachments and returns the first one", () => {
    const attachments = [
      { mimeType: "text/plain" },
      { mimeType: "image/png", fetchData: async () => new Uint8Array([1, 2]) },
      { mimeType: "image/jpeg" },
    ];

    expect(hasImageAttachment(attachments)).toBe(true);
    expect(getFirstImageAttachment(attachments)).toEqual(attachments[1]);
  });

  it("returns false when there are no image attachments", () => {
    expect(hasImageAttachment([{ mimeType: "application/pdf" }])).toBe(false);
    expect(getFirstImageAttachment([{ mimeType: "application/pdf" }])).toBe(
      undefined,
    );
  });

  it("derives a sensible file extension from the MIME type", () => {
    expect(getExtensionFromMimeType("image/webp")).toBe("webp");
    expect(getExtensionFromMimeType(undefined)).toBe("jpg");
  });

  it("picks the first pending task and falls back to the first task", () => {
    expect(pickNextPendingTask(TASKS, ["task-1"])?.id).toBe("task-2");
    expect(pickNextPendingTask(TASKS, ["task-1", "task-2"])?.id).toBe("task-1");
    expect(pickNextPendingTask([], [])).toBeNull();
  });

  it("formats task prompts", () => {
    expect(formatTaskPrompt(TASKS[0])).toContain("Guide: Keep it tidy");
    expect(formatTaskPrompt(TASKS[1])).not.toContain("Guide:");
  });

  it("formats evaluation messages by score bucket", () => {
    expect(formatEvaluation(90, "Nice work")).toContain("[V]");
    expect(formatEvaluation(65, "Needs polish")).toContain("[!]");
    expect(formatEvaluation(40, "Try again")).toContain("[X]");
  });
});
