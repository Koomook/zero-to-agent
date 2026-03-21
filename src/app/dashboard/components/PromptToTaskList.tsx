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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--card-border)',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div className="card-warm" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>
          ✦
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
          Create Task List with AI
        </h2>
      </div>

      {error ? (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      {phase === "done" ? (
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--success-soft)', color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>
          Task list created successfully!
        </div>
      ) : null}

      {isInputPhase ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your situation... (e.g., 50-person hackathon event with 3 food tables, 1 drink station, 1 merch table)"
            rows={3}
            disabled={phase === "generating"}
            style={{ ...inputStyle, opacity: phase === "generating" ? 0.5 : 1 }}
          />
          <button
            onClick={handleGenerate}
            disabled={phase === "generating" || !prompt.trim()}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: (phase === "generating" || !prompt.trim()) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {phase === "generating" ? (
              <>
                <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
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
