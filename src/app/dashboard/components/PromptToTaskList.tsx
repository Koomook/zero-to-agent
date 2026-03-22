"use client";

import { useCallback, useState } from "react";
import type { GeneratedTask, GeneratedTaskList } from "@/lib/types";
import { TaskPreview } from "./TaskPreview";

type Phase = "idle" | "generating" | "preview" | "saving" | "done";

export function PromptToTaskList({
  onCreated,
}: {
  onCreated: (taskListId: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null);
    setPhase("generating");
    try {
      const res = await fetch("/api/task-lists/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const result: GeneratedTaskList = await res.json();
      setName(result.name);
      setTasks(result.tasks);
      setPhase("preview");
    } catch {
      setError("Failed to generate. Please try again.");
      setPhase("idle");
    }
  }, [prompt]);

  const handleConfirm = useCallback(async () => {
    setPhase("saving");
    setError(null);
    try {
      const res = await fetch("/api/task-lists/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tasks }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setPhase("done");
      onCreated(data.taskList.id);
      setTimeout(() => {
        setPhase("idle");
        setPrompt("");
        setName("");
        setTasks([]);
      }, 2000);
    } catch {
      setError("Failed to save. Please try again.");
      setPhase("preview");
    }
  }, [name, tasks, onCreated]);

  const handleRegenerate = useCallback(() => setPhase("idle"), []);
  const handleRemoveTask = useCallback((index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const handleAddTask = useCallback((task: GeneratedTask) => {
    setTasks((prev) => [...prev, task]);
  }, []);
  const handleUpdateTask = useCallback((index: number, task: GeneratedTask) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? task : t)));
  }, []);

  const isInputPhase = phase === "idle" || phase === "generating";
  const isPreviewPhase = phase === "preview" || phase === "saving";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-sm text-amber-600 dark:bg-amber-900/30">
          ✦
        </span>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Create Task List with AI
        </h2>
      </div>

      {error ? (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          Task list created successfully!
        </div>
      ) : null}

      {isInputPhase ? (
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your situation... (e.g., 50-person hackathon event with 3 food tables, 1 drink station, 1 merch table)"
            rows={5}
            disabled={phase === "generating"}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            onClick={handleGenerate}
            disabled={phase === "generating" || !prompt.trim()}
            className="rounded-md bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {phase === "generating" ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Task List"
            )}
          </button>
        </div>
      ) : null}

      {isPreviewPhase ? (
        <TaskPreview
          tasks={tasks}
          name={name}
          onNameChange={setName}
          onRemoveTask={handleRemoveTask}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onConfirm={handleConfirm}
          onRegenerate={handleRegenerate}
          saving={phase === "saving"}
        />
      ) : null}
    </div>
  );
}
