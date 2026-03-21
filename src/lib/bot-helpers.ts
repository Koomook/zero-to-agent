import type { Task } from "@/lib/types";

type ImageAttachment = {
  mimeType?: string | null;
  fetchData?: (() => Promise<ArrayBuffer | Uint8Array>) | undefined;
};

export function hasImageAttachment(
  attachments?: ImageAttachment[] | null,
): boolean {
  return (
    attachments?.some((attachment) =>
      attachment.mimeType?.startsWith("image/"),
    ) ?? false
  );
}

export function getFirstImageAttachment(
  attachments?: ImageAttachment[] | null,
): ImageAttachment | undefined {
  return attachments?.find((attachment) =>
    attachment.mimeType?.startsWith("image/"),
  );
}

export function getExtensionFromMimeType(mimeType?: string | null): string {
  return mimeType?.split("/")[1] ?? "jpg";
}

export function pickNextPendingTask(
  allTasks: Task[] | null | undefined,
  submittedTaskIds: string[],
): Task | null {
  if (!allTasks?.length) {
    return null;
  }

  const submitted = new Set(submittedTaskIds);
  const pending = allTasks.filter((task) => !submitted.has(task.id));

  return pending[0] ?? allTasks[0];
}

export function formatTaskPrompt(
  task: Pick<Task, "title" | "text_guide" | "assigned_to">,
): string {
  const assignee = task.assigned_to ? `담당: ${task.assigned_to} | ` : "";
  const lines = [
    `**${assignee}${task.title}** - Time to check!`,
    "",
    task.text_guide ? `Guide: ${task.text_guide}` : "",
    "",
    "Please upload a photo of the current state in this thread.",
  ];

  return lines.filter(Boolean).join("\n");
}

export function formatEvaluation(score: number, evaluation: string): string {
  const icon = score >= 80 ? "V" : score >= 60 ? "!" : "X";

  return [
    `[${icon}] AI Score: ${score}/100`,
    "",
    evaluation,
    "",
    score >= 80
      ? "Great job! Waiting for manager review."
      : "Needs improvement. Please check the guide again.",
  ].join("\n");
}
