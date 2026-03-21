import { NextRequest } from "next/server";

import { getBotInstance } from "@/lib/bot";
import { getSupabase } from "@/lib/supabase";
import { formatTaskPrompt } from "@/lib/bot-helpers";
import type { Task } from "@/lib/types";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Auth: accept CRON_SECRET or dashboard trigger param
  const authHeader = req.headers.get("authorization");
  const dashboardTrigger = req.nextUrl.searchParams.get("trigger") === "dashboard";

  if (!dashboardTrigger) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const channelId = process.env.SLACK_CHANNEL_ID;
  if (!channelId) {
    return Response.json(
      { error: "SLACK_CHANNEL_ID not configured" },
      { status: 500 },
    );
  }

  const { bot } = getBotInstance();
  if (!bot) {
    return Response.json({ error: "Bot not configured" }, { status: 500 });
  }

  // Get all tasks
  const { data: tasks } = await getSupabase()
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!tasks?.length) {
    return Response.json({ message: "No tasks to check", sent: 0 });
  }

  try {
    // Initialize bot for proactive messaging
    await bot.initialize();
  } catch (e) {
    console.error("[cron] Bot init failed:", e);
    return Response.json({
      error: "Bot initialization failed",
      details: String(e),
    }, { status: 500 });
  }

  let channel;
  try {
    channel = bot.channel(`slack:${channelId}`);
  } catch (e) {
    console.error("[cron] Channel access failed:", e);
    return Response.json({
      error: "Channel access failed",
      details: String(e),
      channelId,
    }, { status: 500 });
  }

  const sent: string[] = [];
  const errors: string[] = [];

  for (const task of tasks as Task[]) {
    try {
      const message = await channel.post(formatTaskPrompt(task));

      // Extract thread ID from the sent message
      const threadId = message?.id
        ?? `cron-${Date.now()}-${task.id.slice(0, 8)}`;

      // Build the Chat SDK thread ID format: "slack:CHANNEL:TS"
      const slackThreadId = `slack:${channelId}:${threadId}`;

      // Subscribe to this thread so onSubscribedMessage fires
      // when staff replies with images
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stateAdapter = (bot as any)._stateAdapter;
        if (stateAdapter?.subscribe) {
          await stateAdapter.subscribe(slackThreadId);
          console.log(`[cron] Subscribed to thread: ${slackThreadId}`);
        }
      } catch (subErr) {
        console.error(`[cron] Subscribe failed for ${task.title}:`, subErr);
      }

      await getSupabase()
        .from("task_submissions")
        .insert({
          task_id: task.id,
          thread_id: slackThreadId,
          platform: "slack",
          staff_name: null,
          status: "pending",
        });

      sent.push(task.title);
    } catch (e) {
      const errMsg = `${task.title}: ${String(e)}`;
      console.error(`[cron] Failed:`, errMsg);
      errors.push(errMsg);
    }
  }

  return Response.json({
    message: `Sent ${sent.length}/${tasks.length} task checks`,
    sent,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
