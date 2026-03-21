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

  // Initialize bot for proactive messaging
  await bot.initialize();

  const channel = bot.channel(`slack:${channelId}`);
  const sent: string[] = [];

  for (const task of tasks as Task[]) {
    try {
      const message = await channel.post(formatTaskPrompt(task));

      // Create a submission record linked to this thread
      if (message) {
        const threadId =
          (message as unknown as { id?: string })?.id ?? `cron-${Date.now()}`;

        await getSupabase()
          .from("task_submissions")
          .insert({
            task_id: task.id,
            thread_id: threadId,
            platform: "slack",
            staff_name: null,
            status: "pending",
          });

        sent.push(task.title);
      }
    } catch (e) {
      console.error(`[cron] Failed to send task "${task.title}":`, e);
    }
  }

  return Response.json({
    message: `Sent ${sent.length} task checks`,
    sent,
    timestamp: new Date().toISOString(),
  });
}
