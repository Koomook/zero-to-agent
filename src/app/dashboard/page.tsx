"use client";

import { useCallback, useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  text_guide: string | null;
  expected_image_url: string | null;
  sort_order: number;
};

type Submission = {
  id: string;
  task_id: string;
  staff_name: string | null;
  platform: string;
  before_image_url: string | null;
  after_image_url: string | null;
  ai_guide: string | null;
  ai_score: number | null;
  ai_evaluation: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  task: Task;
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400">-</span>;
  const color =
    score >= 80
      ? "bg-green-100 text-green-800"
      : score >= 60
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
      {score}/100
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    reviewed: "bg-blue-100 text-blue-800",
    ok: "bg-green-100 text-green-800",
    fail: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [tasksRes, subsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/submissions"),
    ]);
    setTasks(await tasksRes.json());
    setSubmissions(await subsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleReview(submissionId: string, status: "ok" | "fail") {
    await fetch(`/api/submissions/${submissionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  const allOk =
    submissions.length > 0 && submissions.every((s) => s.status === "ok");

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Shelf Coach Dashboard
            </h1>
            <p className="mt-1 text-slate-500">
              Manager Review Board &middot; {tasks.length} tasks &middot;{" "}
              {submissions.length} submissions
            </p>
          </div>
          {allOk && (
            <div className="rounded-2xl bg-green-600 px-6 py-3 text-lg font-bold text-white shadow-lg">
              Ready to Payout
            </div>
          )}
        </div>

        {/* Task Overview */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            Task List
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">{task.title}</h3>
                {task.text_guide && (
                  <p className="mt-2 text-sm text-slate-600">
                    {task.text_guide}
                  </p>
                )}
                {task.expected_image_url && (
                  <img
                    src={task.expected_image_url}
                    alt="Expected"
                    className="mt-3 h-32 w-full rounded-xl object-cover"
                  />
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="col-span-full text-slate-400">
                No tasks created yet. Run the seed script to add demo tasks.
              </p>
            )}
          </div>
        </section>

        {/* Submissions Review Board */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            Submissions
          </h2>
          <div className="space-y-6">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {sub.task?.title ?? "Unknown Task"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {sub.staff_name ?? "Anonymous"} &middot; {sub.platform}{" "}
                      &middot;{" "}
                      {new Date(sub.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={sub.ai_score} />
                    <StatusBadge status={sub.status} />
                  </div>
                </div>

                {/* Image comparison */}
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      Expected
                    </p>
                    {sub.task?.expected_image_url ? (
                      <img
                        src={sub.task.expected_image_url}
                        alt="Expected"
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      Before
                    </p>
                    {sub.before_image_url ? (
                      <img
                        src={sub.before_image_url}
                        alt="Before"
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        Waiting...
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      After
                    </p>
                    {sub.after_image_url ? (
                      <img
                        src={sub.after_image_url}
                        alt="After"
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        Waiting...
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Evaluation */}
                {sub.ai_evaluation && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      AI Evaluation
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {sub.ai_evaluation}
                    </p>
                  </div>
                )}

                {/* AI Guide */}
                {sub.ai_guide && (
                  <div className="mt-3 rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-400">
                      AI Guide
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-blue-800">
                      {sub.ai_guide}
                    </p>
                  </div>
                )}

                {/* Review buttons */}
                {sub.status === "reviewed" && (
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => handleReview(sub.id, "ok")}
                      className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Approve (OK)
                    </button>
                    <button
                      onClick={() => handleReview(sub.id, "fail")}
                      className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Reject (Fail)
                    </button>
                  </div>
                )}
              </div>
            ))}
            {submissions.length === 0 && (
              <p className="text-slate-400">
                No submissions yet. Mention the bot in Slack to start a task.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
