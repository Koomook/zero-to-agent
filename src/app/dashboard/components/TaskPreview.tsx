"use client";

import { useState } from "react";
import type { GeneratedTask } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--card-border)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Task list name */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
          Task List Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Generated tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((task, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--card-border)',
              background: 'var(--background)',
            }}
          >
            <span
              className="font-data"
              style={{
                marginTop: 2,
                width: 24, height: 24,
                borderRadius: '50%',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>
                {task.title}
              </p>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                {task.text_guide}
              </p>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>담당:</span>
                <input
                  type="text"
                  value={task.assigned_to ?? ""}
                  onChange={(e) => onUpdateTask(i, { ...task, assigned_to: e.target.value || null })}
                  placeholder="미배정"
                  style={{
                    ...inputStyle,
                    padding: '4px 8px',
                    fontSize: 12,
                    width: 120,
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => onRemoveTask(i)}
              style={{
                flexShrink: 0,
                width: 28, height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add task */}
      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 10, border: '2px dashed var(--card-border)' }}>
          <input
            type="text"
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="Text guide (what to check)"
            value={newGuide}
            onChange={(e) => setNewGuide(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--foreground)',
                color: 'var(--background)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: !newTitle.trim() ? 0.4 : 1,
              }}
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: '1px solid var(--card-border)',
                background: 'transparent',
                color: 'var(--foreground)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 10,
            border: '2px dashed var(--card-border)',
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          + Add Task
        </button>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button
          onClick={onConfirm}
          disabled={saving || tasks.length === 0 || !name.trim()}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: (saving || tasks.length === 0 || !name.trim()) ? 0.5 : 1,
          }}
        >
          {saving ? "Saving..." : "Confirm & Save"}
        </button>
        <button
          onClick={onRegenerate}
          disabled={saving}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            border: '1px solid var(--card-border)',
            background: 'transparent',
            color: 'var(--foreground)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
