import { memo } from "react";
import type { SubmissionWithTask } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

function ImageCell({
  src,
  label,
  placeholder,
}: {
  src: string | null;
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="font-data" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 8 }}>
        {label}
      </p>
      {src ? (
        <img
          src={src}
          alt={label}
          style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 160,
            borderRadius: 10,
            background: 'var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            color: 'var(--muted)',
          }}
        >
          {placeholder ?? "No image"}
        </div>
      )}
    </div>
  );
}

export const SubmissionCard = memo(function SubmissionCard({
  submission,
  onReview,
}: {
  submission: SubmissionWithTask;
  onReview: (id: string, status: "ok" | "fail") => void;
}) {
  return (
    <div className="card-warm" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
            {submission.task?.title ?? "Unknown Task"}
          </h3>
          <p className="font-data" style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
            {submission.staff_name ?? "Anonymous"} &middot;{" "}
            {submission.platform} &middot;{" "}
            {new Date(submission.created_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ScoreBadge score={submission.ai_score} />
          <StatusBadge status={submission.status} />
        </div>
      </div>

      {/* 4-column image comparison */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <ImageCell src={submission.task?.expected_image_url ?? null} label="Expected" />
        <ImageCell src={submission.before_image_url} label="Before" placeholder="Waiting..." />
        <ImageCell src={submission.ai_guide_image_url} label="AI Guide" placeholder="Generating..." />
        <ImageCell src={submission.after_image_url} label="After" placeholder="Waiting..." />
      </div>

      {/* AI Evaluation */}
      {submission.ai_evaluation ? (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'var(--card-border)' }}>
          <p className="font-data" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 6 }}>
            AI Evaluation
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>
            {submission.ai_evaluation}
          </p>
        </div>
      ) : null}

      {/* AI Guide */}
      {submission.ai_guide ? (
        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: 'var(--info-soft)' }}>
          <p className="font-data" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--info)', marginBottom: 6 }}>
            AI Guide
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--foreground)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {submission.ai_guide}
          </p>
        </div>
      ) : null}

      {/* Review buttons */}
      {submission.status === "reviewed" ? (
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            onClick={() => onReview(submission.id, "ok")}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--success)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Approve
          </button>
          <button
            onClick={() => onReview(submission.id, "fail")}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: '1px solid var(--danger)',
              background: 'transparent',
              color: 'var(--danger)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Reject
          </button>
        </div>
      ) : null}
    </div>
  );
});
