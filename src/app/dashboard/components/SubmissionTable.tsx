"use client";

import { memo } from "react";
import type { SubmissionWithTask } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

export const SubmissionTable = memo(function SubmissionTable({
  submissions,
  selectedId,
  onSelect,
}: {
  submissions: SubmissionWithTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No submissions yet. Send checks to Slack to start collecting.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Staff</th>
            <th className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Task</th>
            <th className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400 text-center">Score</th>
            <th className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {submissions.map((sub) => (
            <tr
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`cursor-pointer transition-colors ${
                selectedId === sub.id
                  ? "bg-zinc-100 dark:bg-zinc-900"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                {sub.staff_name ?? "Anonymous"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {sub.task?.title ?? "Unknown"}
              </td>
              <td className="px-4 py-3 text-center">
                <ScoreBadge score={sub.ai_score} />
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={sub.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
