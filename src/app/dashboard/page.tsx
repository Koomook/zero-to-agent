"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Task, TaskList, SubmissionWithTask } from "@/lib/types";
import { TopBar } from "./components/TopBar";
import { TaskTable } from "./components/TaskTable";
import { TaskDetailModal } from "./components/TaskDetailModal";
import { SubmissionTable } from "./components/SubmissionTable";
import { SubmissionDetail } from "./components/SubmissionDetail";
import { PromptToTaskList } from "./components/PromptToTaskList";

type Tab = "tasks" | "evaluations";

async function fetchAllData(listId: string) {
  const filter = listId ? `?task_list_id=${listId}` : "";
  const [taskListsRes, tasksRes, subsRes] = await Promise.all([
    fetch("/api/task-lists"),
    fetch(`/api/tasks${filter}`),
    fetch(`/api/submissions${filter}`),
  ]);
  return {
    taskLists: (await taskListsRes.json()) as TaskList[],
    tasks: (await tasksRes.json()) as Task[],
    submissions: (await subsRes.json()) as SubmissionWithTask[],
  };
}

export default function DashboardPage() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("tasks");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  // Task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  // Submission detail panel
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const selectedListIdRef = useRef(selectedListId);
  selectedListIdRef.current = selectedListId;

  const refreshData = useCallback(async (listId?: string) => {
    const id = listId ?? selectedListIdRef.current;
    const data = await fetchAllData(id);
    setTaskLists(data.taskLists);
    setTasks(data.tasks);
    setSubmissions(data.submissions);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchAllData(selectedListId);
      if (cancelled) return;
      setTaskLists(data.taskLists);
      setTasks(data.tasks);
      setSubmissions(data.submissions);
      setLoading(false);
    };
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedListId]);

  const handleSendCheck = useCallback(async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/cron/check-tasks?trigger=dashboard");
      const data = await res.json();
      if (!res.ok || data.error) {
        setSendResult(data.error ?? "Failed to send checks");
      } else {
        setSendResult(`Sent ${data.sent?.length ?? 0} checks to Slack`);
      }
      refreshData();
      setTimeout(() => setSendResult(null), 4000);
    } catch {
      setSendResult("Failed to send checks");
      setTimeout(() => setSendResult(null), 4000);
    }
    setSending(false);
  }, [refreshData]);

  const handleReview = useCallback(
    async (submissionId: string, status: "ok" | "fail") => {
      await fetch(`/api/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      refreshData();
    },
    [refreshData],
  );

  const handleTaskListCreated = useCallback(
    (newListId: string) => {
      setSelectedListId(newListId);
      refreshData(newListId);
    },
    [refreshData],
  );

  const allOk =
    submissions.length > 0 && submissions.every((s) => s.status === "ok");

  const selectedSubmission = submissions.find((s) => s.id === selectedSubId) ?? null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <TopBar
        taskLists={taskLists}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
        onSendCheck={handleSendCheck}
        sending={sending}
        sendResult={sendResult}
        allOk={allOk}
        taskCount={tasks.length}
        submissionCount={submissions.length}
      />

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 lg:px-8">
        {/* AI Generator */}
        <div className="mb-8">
          <PromptToTaskList onCreated={handleTaskListCreated} />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setTab("tasks")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "tasks"
                ? "border-amber-600 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setTab("evaluations")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "evaluations"
                ? "border-amber-600 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            Evaluations
          </button>
        </div>

        {/* Tab Content */}
        {tab === "tasks" ? (
          <TaskTable tasks={tasks} onSelect={setSelectedTask} onUpdated={refreshData} />
        ) : (
          <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            {/* Left: table */}
            <div className={`flex-1 overflow-auto ${selectedSubmission ? "border-r border-zinc-200 dark:border-zinc-800" : ""}`}>
              <SubmissionTable
                submissions={submissions}
                selectedId={selectedSubId}
                onSelect={setSelectedSubId}
              />
            </div>
            {/* Right: detail panel */}
            {selectedSubmission ? (
              <div className="w-96 shrink-0 bg-white dark:bg-zinc-950">
                <SubmissionDetail
                  submission={selectedSubmission}
                  onReview={handleReview}
                  onClose={() => setSelectedSubId(null)}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask ? (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            setSelectedTask(null);
            refreshData();
          }}
        />
      ) : null}
    </div>
  );
}
