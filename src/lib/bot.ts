import { google } from "@ai-sdk/google";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createMemoryState } from "@chat-adapter/state-memory";
import { generateText } from "ai";
import { Chat } from "chat";

import { getBotRuntimeStatus, hasCompleteBotEnv } from "@/lib/env";
import {
  formatEvaluation,
  formatTaskPrompt,
  getExtensionFromMimeType,
  getFirstImageAttachment,
  hasImageAttachment,
  pickNextPendingTask,
} from "@/lib/bot-helpers";
import { getSupabase, uploadImage } from "@/lib/supabase";
import { analyzeBeforeImage, evaluateAfterImage, generateGuideImage } from "@/lib/gemini";
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

async function getNextPendingTask(
  threadId?: string,
): Promise<Task | null> {
  const supabase = getSupabase();

  // If this thread already has a submission, return that task
  if (threadId) {
    const { data: existing } = await supabase
      .from("task_submissions")
      .select("task_id")
      .eq("thread_id", threadId)
      .limit(1);

    if (existing?.[0]) {
      const { data: task } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", existing[0].task_id)
        .single();
      return task;
    }
  }

  // Find a task that has no submissions yet
  const { data: allTasks } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!allTasks?.length) return null;

  const { data: submittedTaskIds } = await supabase
    .from("task_submissions")
    .select("task_id");

  return pickNextPendingTask(
    allTasks,
    (submittedTaskIds ?? []).map((submission) => submission.task_id),
  );
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

async function generateReply(input: string) {
  const prompt = input.trim() || "Say hello and explain you are Shelf Coach.";

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    prompt,
  });

  return result.text.trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendExpectedImage(thread: any, task: Task) {
  if (!task.expected_image_url) return;

  try {
    const res = await fetch(task.expected_image_url);
    if (!res.ok) return;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";

    await thread.post({
      markdown: "Target state:",
      files: [
        {
          data: buffer,
          filename: `expected.${contentType.split("/")[1] ?? "jpg"}`,
          mimeType: contentType,
        },
      ],
    });
  } catch {
    // If image fetch fails, just skip sending the image
  }
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

    const task = await getNextPendingTask(thread.id);
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
    await sendExpectedImage(thread, task);
  });

  bot.onDirectMessage(async (thread, message) => {
    await thread.subscribe();

    if (!hasTaskMode()) {
      await handleConversation(thread, message.text ?? "");
      return;
    }

    const task = await getNextPendingTask(thread.id);
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
    await sendExpectedImage(thread, task);
  });

  bot.onSubscribedMessage(async (thread, message) => {
    if (!hasImageAttachment(message.attachments) || !hasTaskMode()) {
      await handleConversation(thread, message.text ?? "");
      return;
    }

    const submission = await getSubmissionByThread(thread.id);
    if (!submission) {
      await handleConversation(thread, message.text ?? "Describe what you see in this image.");
      return;
    }

    const imageAttachment = getFirstImageAttachment(message.attachments);
    if (!imageAttachment?.fetchData) {
      await thread.post("Could not process the image. Please try again.");
      return;
    }

    let imageBuffer: Buffer;
    try {
      const imageData = await imageAttachment.fetchData();
      imageBuffer =
        imageData instanceof Uint8Array
          ? Buffer.from(imageData)
          : Buffer.from(new Uint8Array(imageData));
    } catch {
      await thread.post("Failed to download the image. Please try uploading again.");
      return;
    }

    const mimeType = imageAttachment.mimeType ?? "image/jpeg";
    const ext = getExtensionFromMimeType(mimeType);

    let imageUrl: string;
    try {
      imageUrl = await uploadImage(imageBuffer, `submission.${ext}`, mimeType);
    } catch (e) {
      console.error("[shelf-coach] Upload error:", e);
      await thread.post("Failed to save image. Please try again.");
      return;
    }

    if (!submission.before_image_url) {
      let guide: string;
      try {
        guide = await analyzeBeforeImage(
          imageBuffer,
          submission.task.expected_image_url,
          submission.task.text_guide,
          mimeType,
        );
      } catch (e) {
        console.error("[shelf-coach] Gemini analyze error:", e);
        guide = "AI guide generation failed. Please follow the task guide above.";
      }

      // Generate guide image in parallel with text guide
      const guideImageResult = await generateGuideImage(
        imageBuffer,
        submission.task.expected_image_url,
        submission.task.text_guide,
        mimeType,
      );

      let aiGuideImageUrl: string | null = null;
      if (guideImageResult) {
        try {
          const ext = guideImageResult.mimeType.split("/")[1] ?? "png";
          aiGuideImageUrl = await uploadImage(
            guideImageResult.guideImage,
            `guide.${ext}`,
            guideImageResult.mimeType,
          );
        } catch (e) {
          console.error("[shelf-coach] Guide image upload error:", e);
        }
      }

      await updateSubmission(submission.id, {
        before_image_url: imageUrl,
        ai_guide: guide,
        ai_guide_image_url: aiGuideImageUrl,
      });

      await thread.post(
        [
          "Before image received! Here's your guide:",
          "",
          guide,
          "",
          "After completing the task, upload the After image!",
        ].join("\n"),
      );

      // Send AI-generated guide image if available
      if (guideImageResult) {
        try {
          await thread.post({
            markdown: "Here's what it should look like:",
            files: [
              {
                data: guideImageResult.guideImage,
                filename: `guide.${guideImageResult.mimeType.split("/")[1] ?? "png"}`,
                mimeType: guideImageResult.mimeType,
              },
            ],
          });
        } catch (e) {
          console.error("[shelf-coach] Guide image send error:", e);
        }
      }
    } else {
      let score: number;
      let evaluation: string;
      try {
        const result = await evaluateAfterImage(
          imageBuffer,
          submission.task.expected_image_url,
          submission.task.text_guide,
          mimeType,
        );
        score = result.score;
        evaluation = result.evaluation;
      } catch (e) {
        console.error("[shelf-coach] Gemini evaluate error:", e);
        score = 0;
        evaluation = "AI evaluation failed. Manager will review manually.";
      }

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
