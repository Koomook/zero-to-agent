"use client";

import { useState } from "react";
import type { GeneratedTask } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function TaskPreview({
  tasks,
  name,
  onNameChange,
  onRemoveTask,
  onAddTask,
  onUpdateTask,
  onConfirm,
  onRegenerate,
  saving,
}: {
  tasks: GeneratedTask[];
  name: string;
  onNameChange: (name: string) => void;
  onRemoveTask: (index: number) => void;
  onAddTask: (task: GeneratedTask) => void;
  onUpdateTask: (index: number, task: GeneratedTask) => void;
  onConfirm: () => void;
  onRegenerate: () => void;
  saving: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGuide, setNewGuide] = useState("");

  function handleAdd() {
    if (!newTitle.trim()) return;
    onAddTask({ title: newTitle.trim(), text_guide: newGuide.trim(), assigned_to: null });
    setNewTitle("");
    setNewGuide("");
    setAdding(false);
  }

  return (
    <div className="space-y-4">
      {/* Task list name */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
          Task List Name
        </label>
        <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)} className={inputClass} />
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 font-mono text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{task.text_guide}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Assigned:</span>
                <input
                  type="text"
                  value={task.assigned_to ?? ""}
                  onChange={(e) => onUpdateTask(i, { ...task, assigned_to: e.target.value || null })}
                  placeholder="Unassigned"
                  className="w-28 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>
            <button
              onClick={() => onRemoveTask(i)}
              className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add task */}
      {adding ? (
        <div className="space-y-2 rounded-md border-2 border-dashed border-zinc-300 p-3 dark:border-zinc-600">
          <input type="text" placeholder="Task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputClass} />
          <textarea placeholder="Text guide" value={newGuide} onChange={(e) => setNewGuide(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-md border-2 border-dashed border-zinc-300 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-600 dark:hover:border-zinc-500"
        >
          + Add Task
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onConfirm}
          disabled={saving || tasks.length === 0 || !name.trim()}
          className="rounded-md bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Confirm & Save"}
        </button>
        <button
          onClick={onRegenerate}
          disabled={saving}
          className="rounded-md border border-zinc-300 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
