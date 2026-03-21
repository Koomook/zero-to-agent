"use client";

import { useState, useRef } from "react";
import { Task, Staff } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import TaskDetailModal from "@/components/task-detail-modal";

const staffList: Staff[] = [
  { id: "1", name: "田中 太郎" },
  { id: "2", name: "佐藤 花子" },
  { id: "3", name: "鈴木 一郎" },
  { id: "4", name: "高橋 美咲" },
  { id: "5", name: "伊藤 健太" },
];

const initialTasks: Task[] = [
  {
    id: "1",
    title: "レジ対応",
    description: "レジでの会計業務。正確な金銭管理と丁寧な接客を行う。",
    assigneeId: "1",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-03-25",
    createdAt: "2026-03-20",
    evaluator: "human",
    achievements: [
      { id: "a1", taskId: "1", title: "開店準備（レジ立ち上げ）", completed: true, order: 1 },
      { id: "a2", taskId: "1", title: "午前シフト対応", completed: true, order: 2 },
      { id: "a3", taskId: "1", title: "午後シフト対応", completed: false, order: 3 },
      { id: "a4", taskId: "1", title: "締め作業（レジ締め）", completed: false, order: 4 },
    ],
  },
  {
    id: "2",
    title: "在庫確認",
    description: "店舗内の在庫を確認し、不足があれば発注リストに追加する。",
    assigneeId: "2",
    status: "pending",
    priority: "medium",
    dueDate: "2026-03-24",
    createdAt: "2026-03-20",
    evaluator: "agent_auto",
    achievements: [
      { id: "a5", taskId: "2", title: "食品棚の確認", completed: false, order: 1 },
      { id: "a6", taskId: "2", title: "日用品棚の確認", completed: false, order: 2 },
      { id: "a7", taskId: "2", title: "発注リスト作成", completed: false, order: 3 },
    ],
  },
  {
    id: "3",
    title: "清掃業務",
    description: "店舗内外の清掃。開店前と閉店後に実施。",
    assigneeId: "",
    status: "pending",
    priority: "low",
    dueDate: "2026-03-23",
    createdAt: "2026-03-20",
    evaluator: "human",
    achievements: [
      { id: "a8", taskId: "3", title: "店内清掃", completed: false, order: 1 },
      { id: "a9", taskId: "3", title: "トイレ清掃", completed: false, order: 2 },
      { id: "a10", taskId: "3", title: "外回り清掃", completed: false, order: 3 },
    ],
  },
];

function parseCSV(text: string): Task[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const titleIdx = headers.indexOf("title");
  const descIdx = headers.indexOf("description");
  const priorityIdx = headers.indexOf("priority");
  const dueDateIdx = headers.indexOf("dueDate");
  const evaluatorIdx = headers.indexOf("evaluator");
  const achievementsIdx = headers.indexOf("achievements");

  if (titleIdx === -1) return [];

  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map((c) => c.trim());
    const taskId = `upload-${Date.now()}-${i}`;
    const achievementTitles =
      achievementsIdx !== -1 && cols[achievementsIdx]
        ? cols[achievementsIdx].split("|").filter(Boolean)
        : [];

    return {
      id: taskId,
      title: cols[titleIdx] || "",
      description: descIdx !== -1 ? cols[descIdx] || "" : "",
      assigneeId: "",
      status: "pending" as const,
      priority:
        priorityIdx !== -1 && ["low", "medium", "high"].includes(cols[priorityIdx])
          ? (cols[priorityIdx] as Task["priority"])
          : "medium",
      dueDate: dueDateIdx !== -1 ? cols[dueDateIdx] || "" : "",
      createdAt: new Date().toISOString().split("T")[0],
      evaluator:
        evaluatorIdx !== -1 && ["human", "agent_auto"].includes(cols[evaluatorIdx])
          ? (cols[evaluatorIdx] as Task["evaluator"])
          : "human",
      achievements: achievementTitles.map((title, j) => ({
        id: `${taskId}-a${j}`,
        taskId,
        title,
        completed: false,
        order: j + 1,
      })),
    };
  });
}

export default function TasksPage() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStaffName = (id: string) =>
    staffList.find((s) => s.id === id)?.name ?? t.common.unassigned;

  const handleAssign = (taskId: string, staffId: string) => {
    setTasks((prev) =>
      prev.map((tk) => (tk.id === taskId ? { ...tk, assigneeId: staffId } : tk))
    );
    setAssigningTaskId(null);
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks((prev) => prev.map((tk) => (tk.id === updated.id ? updated : tk)));
    setSelectedTask(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const newTasks = parseCSV(text);
      if (newTasks.length > 0) {
        setTasks((prev) => [...prev, ...newTasks]);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const priorityColor = {
    low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const priorityLabel = {
    high: t.tasks.priorityHigh,
    medium: t.tasks.priorityMedium,
    low: t.tasks.priorityLow,
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.tasks.title}</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t.tasks.csvUpload}
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {tasks.map((task) => {
          const done = task.achievements.filter((a) => a.completed).length;
          const total = task.achievements.length;

          return (
            <li
              key={task.id}
              className="flex cursor-pointer items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-center gap-3">
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${priorityColor[task.priority]}`}>
                  {priorityLabel[task.priority]}
                </span>
                <span>{task.title}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${task.evaluator === "agent_auto" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                  {task.evaluator === "agent_auto" ? t.common.agentAuto : t.common.human}
                </span>
                {total > 0 && (
                  <span className="text-xs text-zinc-400">
                    {done}/{total}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {task.assigneeId ? getStaffName(task.assigneeId) : t.common.unassigned}
                </span>
                {assigningTaskId === task.id ? (
                  <select
                    autoFocus
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    value={task.assigneeId}
                    onChange={(e) => handleAssign(task.id, e.target.value)}
                    onBlur={() => setAssigningTaskId(null)}
                  >
                    <option value="">{t.common.unassigned}</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    onClick={() => setAssigningTaskId(task.id)}
                    className="rounded-md bg-zinc-200 px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    {t.common.assign}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          staffList={staffList}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </div>
  );
}
