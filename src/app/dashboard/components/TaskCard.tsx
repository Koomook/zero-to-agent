"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { Task } from "@/lib/types";

export const TaskCard = memo(function TaskCard({
  task,
  onUpdated,
}: {
  task: Task;
  onUpdated?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/tasks/${task.id}/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        onUpdated?.();
      } catch {
        alert("Image upload failed");
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [task.id, onUpdated],
  );

  return (
    <div className="card-warm" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
          {task.title}
        </h3>
        {task.reward_amount > 0 ? (
          <span className="badge" style={{ background: 'var(--success-soft)', color: 'var(--success)', flexShrink: 0 }}>
            ${task.reward_amount}
          </span>
        ) : null}
      </div>

      {task.assigned_to ? (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 6,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          fontSize: 11,
          fontWeight: 500,
          marginTop: 4,
        }}>
          Assigned: {task.assigned_to}
        </span>
      ) : (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 6,
          background: 'var(--card-border)',
          color: 'var(--muted)',
          fontSize: 11,
          marginTop: 4,
        }}>
          Unassigned
        </span>
      )}

      {task.description ? (
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
          {task.description}
        </p>
      ) : null}

      {task.text_guide ? (
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--foreground)', opacity: 0.8, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {task.text_guide}
        </p>
      ) : null}

      {/* Expected image or upload */}
      {task.expected_image_url ? (
        <div className="img-upload-trigger" style={{ position: 'relative', marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
          <img
            src={task.expected_image_url}
            alt="Expected"
            style={{ width: '100%', height: 128, objectFit: 'cover', display: 'block' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="img-upload-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {uploading ? "Uploading..." : "Replace Image"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            marginTop: 12,
            width: '100%',
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            border: '2px dashed var(--card-border)',
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          {uploading ? "Uploading..." : "Upload Expected Image"}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
});
