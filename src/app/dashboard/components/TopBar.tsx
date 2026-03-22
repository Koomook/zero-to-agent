"use client";

import { memo } from "react";
import type { TaskList } from "@/lib/types";

export const TopBar = memo(function TopBar({
  taskLists,
  selectedListId,
  onSelectList,
  onSendCheck,
  sending,
  sendResult,
  allOk,
  taskCount,
  submissionCount,
}: {
  taskLists: TaskList[];
  selectedListId: string;
  onSelectList: (id: string) => void;
  onSendCheck: () => void;
  sending: boolean;
  sendResult: string | null;
  allOk: boolean;
  taskCount: number;
  submissionCount: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      {/* Left: Logo + stats */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          <span className="mr-1.5 text-amber-600">&#x25C6;</span>
          Kani
        </h1>
        <span className="hidden font-mono text-xs text-zinc-400 dark:text-zinc-500 sm:block">
          {taskCount} tasks &middot; {submissionCount} submissions
        </span>
      </div>

      {/* Right: Filter + Actions */}
      <div className="flex items-center gap-3">
        {sendResult ? (
          <span className={`rounded-md px-3 py-1 text-xs font-medium ${
            sendResult.startsWith("Sent")
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {sendResult}
          </span>
        ) : null}

        <select
          value={selectedListId}
          onChange={(e) => onSelectList(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="">All Lists</option>
          {taskLists.map((tl) => (
            <option key={tl.id} value={tl.id}>
              {tl.name}
            </option>
          ))}
        </select>

        <button
          onClick={onSendCheck}
          disabled={sending}
          className="rounded-md border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {sending ? "Sending..." : "Send Check"}
        </button>

        {allOk ? (
          <span className="rounded-full bg-teal-600 px-3 py-1 font-mono text-xs font-semibold text-white">
            Ready to Payout
          </span>
        ) : null}
      </div>
    </header>
  );
});
