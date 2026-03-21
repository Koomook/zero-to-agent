import { google } from "@ai-sdk/google";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";
import { generateText } from "ai";
import { Chat } from "chat";

import { getBotRuntimeStatus, hasCompleteBotEnv } from "@/lib/env";
import { getSupabase, uploadImage } from "@/lib/supabase";
import { analyzeBeforeImage, evaluateAfterImage } from "@/lib/gemini";
import type { Task, TaskSubmission } from "@/lib/types";

const SYSTEM_PROMPT = [
  "You are Shelf Coach, an AI-powered operational assistant.",
  "For this demo, default to being a helpful conversational assistant in Slack.",
  "If task mode is available, you can guide staff through operational photo tasks.",
  "Be concise, actionable, and encouraging.",
  "If the user writes in Korean, respond in Korean. Otherwise respond in English.",
].join(" ");

type BotInstanceResult = {
  bot: Chat | null;
  missing: string[];
};

let cached: BotInstanceResult | null = null;

function createAdapters() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapters: Record<string, any> = {};

  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET) {
    adapters.slack = createSlackAdapter();
  }
  if (process.env.TELEGRAM_BOT_TOKEN) {
    adapters.telegram = createTelegramAdapter();
  }
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    adapters.whatsapp = createWhatsAppAdapter();
  }

  return adapters;
}

function hasTaskMode() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

async function getNextPendingTask(): Promise<Task | null> {
  const { data } = await getSupabase()
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true })
    .limit(1);

  return data?.[0] ?? null;
}

async function getSubmissionByThread(
  threadId: string,
): Promise<(TaskSubmission & { task: Task }) | null> {
  const { data } = await getSupabase()
    .from("task_submissions")
    .select("*, task:tasks(*)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!data?.[0]) return null;
  return {
    ...data[0],
    task: data[0].task as unknown as Task,
  };
}

async function createSubmission(
  taskId: string,
  threadId: string,
  platform: string,
  staffName: string | null,
) {
  const { data } = await getSupabase()
    .from("task_submissions")
    .insert({
      task_id: taskId,
      thread_id: threadId,
      platform,
      staff_name: staffName,
    })
    .select()
    .single();

  return data;
}

async function updateSubmission(id: string, updates: Partial<TaskSubmission>) {
  await getSupabase().from("task_submissions").update(updates).eq("id", id);
}

function formatTaskPrompt(task: Task): string {
  const lines = [
    `**${task.title}** - Time to check!`,
    "",
    task.text_guide ? `Guide: ${task.text_guide}` : "",
    "",
    "Please upload a photo of the current state in this thread.",
  ];
  return lines.filter(Boolean).join("\n");
}

function formatEvaluation(score: number, evaluation: string): string {
  const emoji = score >= 80 ? "V" : score >= 60 ? "!" : "X";
  return [
    `[${emoji}] AI Score: ${score}/100`,
    "",
    evaluation,
    "",
    score >= 80
      ? "Great job! Waiting for manager review."
      : "Needs improvement. Please check the guide again.",
  ].join("\n");
}

async function generateReply(input: string) {
  const prompt = input.trim() || "Say hello and explain you are Shelf Coach.";

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    prompt,
  });

  return result.text.trim();
}

async function handleConversation(thread: { post: (message: string) => Promise<unknown> }, text: string) {
  const reply = await generateReply(text);
  await thread.post(reply);
}

function createBot() {
  const adapters = createAdapters();

  if (Object.keys(adapters).length === 0) {
    return null;
  }

  const bot = new Chat({
    userName: "shelf-coach",
    adapters,
    state: createMemoryState(),
  });

  bot.onNewMention(async (thread, message) => {
    await thread.subscribe();

    if (!hasTaskMode()) {
      await handleConversation(thread, message.text ?? "");
      return;
    }

    const task = await getNextPendingTask();
    if (!task) {
      await handleConversation(thread, message.text ?? "");
      return;
    }

    const platform =
      (thread as unknown as { adapter?: { platform?: string } }).adapter
        ?.platform ?? "unknown";
    const staffName = message.author?.fullName ?? null;
    await createSubmission(task.id, thread.id, platform, staffName);

    await thread.post(formatTaskPrompt(task));
  });

  bot.onDirectMessage(async (thread, message) => {
    await thread.subscribe();

    if (!hasTaskMode()) {
      await handleConversation(thread, message.text ?? "");
      return;
    }

    const task = await getNextPendingTask();
    if (!task) {
      await handleConversation(thread, message.text ?? "");
      return;
    }

    const platform =
      (thread as unknown as { adapter?: { platform?: string } }).adapter
        ?.platform ?? "unknown";
    await createSubmission(
      task.id,
      thread.id,
      platform,
      message.author?.fullName ?? null,
    );
    await thread.post(formatTaskPrompt(task));
  });

  bot.onSubscribedMessage(async (thread, message) => {
    const hasImage = message.attachments?.some((a) =>
      a.mimeType?.startsWith("image/"),
    );

    if (!hasImage || !hasTaskMode()) {
      await handleConversation(thread, message.text ?? "");
      return;
    }

    const submission = await getSubmissionByThread(thread.id);
    if (!submission) {
      await handleConversation(thread, message.text ?? "Describe what you see in this image.");
      return;
    }

    const imageAttachment = message.attachments?.find((a) =>
      a.mimeType?.startsWith("image/"),
    );
    if (!imageAttachment?.fetchData) {
      await thread.post("Could not process the image. Please try again.");
      return;
    }

    const imageBuffer = Buffer.from(await imageAttachment.fetchData());
    const imageUrl = await uploadImage(imageBuffer, "submission.jpg");

    if (!submission.before_image_url) {
      const guide = await analyzeBeforeImage(
        imageBuffer,
        submission.task.expected_image_url,
        submission.task.text_guide,
      );

      await updateSubmission(submission.id, {
        before_image_url: imageUrl,
        ai_guide: guide,
      });

      await thread.post(
        [
          "Before image received! Generating guide...",
          "",
          guide,
          "",
          "After completing the task, upload the After image!",
        ].join("\n"),
      );
    } else {
      const { score, evaluation } = await evaluateAfterImage(
        imageBuffer,
        submission.task.expected_image_url,
        submission.task.text_guide,
      );

      await updateSubmission(submission.id, {
        after_image_url: imageUrl,
        ai_score: score,
        ai_evaluation: evaluation,
        status: "reviewed",
      });

      await thread.post(formatEvaluation(score, evaluation));
    }
  });

  return bot;
}

export function getBotInstance(): BotInstanceResult {
  if (cached) {
    return cached;
  }

  const status = getBotRuntimeStatus();

  if (!hasCompleteBotEnv()) {
    cached = {
      bot: null,
      missing: status.missing,
    };

    return cached;
  }

  cached = {
    bot: createBot(),
    missing: [],
  };

  return cached;
}
