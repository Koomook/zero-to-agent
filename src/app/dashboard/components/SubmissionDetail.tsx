"use client";

import type { SubmissionWithTask } from "@/lib/types";

function ImageCell({ src, label, placeholder }: { src: string | null; label: string; placeholder?: string }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      {src ? (
        <img src={src} alt={label} className="h-36 w-full rounded-md object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          {placeholder ?? "No image"}
        </div>
      )}
    </div>
  );
}

export function SubmissionDetail({
  submission,
  onReview,
  onClose,
}: {
  submission: SubmissionWithTask;
  onReview: (id: string, status: "ok" | "fail") => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {submission.task?.title ?? "Unknown Task"}
          </p>
          <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {submission.staff_name ?? "Anonymous"} &middot; {submission.platform}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 2x2 Image grid */}
        <div className="grid grid-cols-2 gap-3">
          <ImageCell src={submission.task?.expected_image_url ?? null} label="Expected" />
          <ImageCell src={submission.before_image_url} label="Before" placeholder="Waiting..." />
          <ImageCell src={submission.ai_guide_image_url} label="AI Guide" placeholder="Generating..." />
          <ImageCell src={submission.after_image_url} label="After" placeholder="Waiting..." />
        </div>

        {/* AI Evaluation */}
        {submission.ai_evaluation ? (
          <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              AI Evaluation
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {submission.ai_evaluation}
            </p>
          </div>
        ) : null}

        {/* AI Guide */}
        {submission.ai_guide ? (
          <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-500 dark:text-blue-400">
              AI Guide
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-blue-800 dark:text-blue-300">
              {submission.ai_guide}
            </p>
          </div>
        ) : null}

        {/* Review buttons */}
        {submission.status === "reviewed" ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onReview(submission.id, "ok")}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Approve
            </button>
            <button
              onClick={() => onReview(submission.id, "fail")}
              className="flex-1 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Reject
            </button>
          </div>
        ) : null}

        {/* Timestamp */}
        <p className="mt-4 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
          {new Date(submission.created_at).toLocaleString()}
          {submission.reviewed_at ? ` · Reviewed ${new Date(submission.reviewed_at).toLocaleString()}` : ""}
        </p>
      </div>
    </div>
  );
}
