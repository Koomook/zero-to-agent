"use client";

import { useCallback, useRef, useState } from "react";
import type { Task } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function TaskDetailModal({
  task,
  onClose,
  onUpdated,
}: {
  task: Task;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          text_guide: draft.text_guide,
          assigned_to: draft.assigned_to,
          reward_amount: draft.reward_amount,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditing(false);
      onUpdated();
    } catch {
      alert("Failed to save");
    }
    setSaving(false);
  }, [task.id, draft, onUpdated]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    onClose();
    onUpdated();
  }, [task.id, onClose, onUpdated]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          {editing ? (
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={`${inputClass} text-lg font-bold`}
            />
          ) : (
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {task.title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-4 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Assigned</span>
            {editing ? (
              <input
                value={draft.assigned_to ?? ""}
                onChange={(e) => setDraft({ ...draft, assigned_to: e.target.value || null })}
                placeholder="Unassigned"
                className={inputClass}
              />
            ) : (
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {task.assigned_to ?? "Unassigned"}
              </p>
            )}
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Reward</span>
            {editing ? (
              <input
                type="number"
                value={draft.reward_amount}
                onChange={(e) => setDraft({ ...draft, reward_amount: Number(e.target.value) })}
                className={inputClass}
              />
            ) : (
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {task.reward_amount > 0 ? `$${task.reward_amount}` : "—"}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Description</span>
          {editing ? (
            <textarea
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
              className={`${inputClass} mt-1 h-20 resize-none`}
            />
          ) : (
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              {task.description || "No description"}
            </p>
          )}
        </div>

        {/* Guide */}
        <div className="mt-4">
          <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Guide</span>
          {editing ? (
            <textarea
              value={draft.text_guide ?? ""}
              onChange={(e) => setDraft({ ...draft, text_guide: e.target.value || null })}
              className={`${inputClass} mt-1 h-24 resize-none`}
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {task.text_guide || "No guide"}
            </p>
          )}
        </div>

        {/* Expected Image */}
        <div className="mt-4">
          <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Expected Image</span>
          {task.expected_image_url ? (
            <div className="group relative mt-2">
              <img
                src={task.expected_image_url}
                alt="Expected"
                className="h-40 w-full rounded-lg object-cover"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 text-sm text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
              >
                {uploading ? "Uploading..." : "Replace"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-sm text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-600"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => { setEditing(false); setDraft(task); }}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
