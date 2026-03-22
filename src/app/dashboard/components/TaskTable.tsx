"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { Task } from "@/lib/types";

export const TaskTable = memo(function TaskTable({
  tasks,
  onSelect,
  onUpdated,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onUpdated: () => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No tasks yet. Use the AI generator above to create a task list.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Task</th>
            <th className="hidden px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400 md:table-cell">Guide</th>
            <th className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Assigned</th>
            <th className="px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400 text-right">Image</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onSelect(task)} onUpdated={onUpdated} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

const TaskRow = memo(function TaskRow({
  task,
  onClick,
  onUpdated,
}: {
  task: Task;
  onClick: () => void;
  onUpdated: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/tasks/${task.id}/upload`, { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        onUpdated();
      } catch {
        alert("Image upload failed");
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [task.id, onUpdated],
  );

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
    >
      {/* Title + reward */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</span>
          {task.reward_amount > 0 ? (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              ${task.reward_amount}
            </span>
          ) : null}
        </div>
      </td>

      {/* Guide (truncated) */}
      <td className="hidden max-w-[300px] px-4 py-3 md:table-cell">
        {task.text_guide ? (
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{task.text_guide}</p>
        ) : (
          <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>
        )}
      </td>

      {/* Assigned */}
      <td className="px-4 py-3">
        {task.assigned_to ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {task.assigned_to}
          </span>
        ) : (
          <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>
        )}
      </td>

      {/* Image */}
      <td className="px-4 py-3 text-right">
        {task.expected_image_url ? (
          <img
            src={task.expected_image_url}
            alt=""
            className="ml-auto h-8 w-12 rounded object-cover"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="ml-auto rounded border border-dashed border-zinc-300 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-500"
          >
            {uploading ? "..." : "Upload"}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </td>
    </tr>
  );
});
