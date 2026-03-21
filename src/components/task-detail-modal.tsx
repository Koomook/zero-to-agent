"use client";

import { useState } from "react";
import { Task, Staff, Priority, TaskStatus } from "@/lib/types";

interface Props {
  task: Task;
  staffList: Staff[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export default function TaskDetailModal({
  task,
  staffList,
  onClose,
  onUpdate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);
  const [newAchievement, setNewAchievement] = useState("");

  const toggleAchievement = (achievementId: string) => {
    const updated = {
      ...task,
      achievements: task.achievements.map((a) =>
        a.id === achievementId ? { ...a, completed: !a.completed } : a
      ),
    };
    onUpdate(updated);
    setDraft(updated);
  };

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(task);
    setEditing(false);
  };

  const addAchievement = () => {
    if (!newAchievement.trim()) return;
    const updated = {
      ...draft,
      achievements: [
        ...draft.achievements,
        {
          id: `${draft.id}-a${Date.now()}`,
          taskId: draft.id,
          title: newAchievement.trim(),
          completed: false,
          order: draft.achievements.length + 1,
        },
      ],
    };
    setDraft(updated);
    setNewAchievement("");
  };

  const removeAchievement = (achievementId: string) => {
    setDraft({
      ...draft,
      achievements: draft.achievements.filter((a) => a.id !== achievementId),
    });
  };

  const completedCount = task.achievements.filter((a) => a.completed).length;
  const totalCount = task.achievements.length;

  const priorityLabel = { low: "低", medium: "中", high: "高" };
  const statusLabel = {
    pending: "未着手",
    in_progress: "進行中",
    completed: "完了",
  };

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          {editing ? (
            <input
              className={inputClass + " mr-2 font-bold"}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          ) : (
            <h2 className="text-xl font-bold">{task.title}</h2>
          )}
          <button
            onClick={onClose}
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {editing ? (
          <textarea
            className={inputClass + " mb-4 h-20 resize-none"}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        ) : (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {task.description}
          </p>
        )}

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-zinc-500">担当者: </span>
            {editing ? (
              <select
                className={inputClass + " mt-1"}
                value={draft.assigneeId}
                onChange={(e) =>
                  setDraft({ ...draft, assigneeId: e.target.value })
                }
              >
                <option value="">未割当</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              staffList.find((s) => s.id === task.assigneeId)?.name ?? "未割当"
            )}
          </div>
          <div>
            <span className="text-zinc-500">優先度: </span>
            {editing ? (
              <select
                className={inputClass + " mt-1"}
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value as Priority })
                }
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            ) : (
              priorityLabel[task.priority]
            )}
          </div>
          <div>
            <span className="text-zinc-500">ステータス: </span>
            {editing ? (
              <select
                className={inputClass + " mt-1"}
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as TaskStatus })
                }
              >
                <option value="pending">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
              </select>
            ) : (
              statusLabel[task.status]
            )}
          </div>
          <div>
            <span className="text-zinc-500">期限: </span>
            {editing ? (
              <input
                type="date"
                className={inputClass + " mt-1"}
                value={draft.dueDate}
                onChange={(e) =>
                  setDraft({ ...draft, dueDate: e.target.value })
                }
              />
            ) : (
              task.dueDate || "未設定"
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>達成項目</span>
            {totalCount > 0 && (
              <span className="text-zinc-500">
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
          {totalCount > 0 && (
            <div className="mb-3 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                }}
              />
            </div>
          )}
          <ul className="space-y-1">
            {(editing ? draft : task).achievements
              .sort((a, b) => a.order - b.order)
              .map((achievement) => (
                <li key={achievement.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={achievement.completed}
                      onChange={() => toggleAchievement(achievement.id)}
                      className="rounded"
                    />
                    <span
                      className={
                        "flex-1" +
                        (achievement.completed
                          ? " text-zinc-400 line-through"
                          : "")
                      }
                    >
                      {achievement.title}
                    </span>
                    {editing && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeAchievement(achievement.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        削除
                      </button>
                    )}
                  </label>
                </li>
              ))}
          </ul>
          {editing && (
            <div className="mt-2 flex gap-2">
              <input
                className={inputClass + " flex-1"}
                placeholder="新しい達成項目..."
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAchievement()}
              />
              <button
                onClick={addAchievement}
                className="rounded-md bg-zinc-200 px-3 py-1 text-sm font-medium hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                追加
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                保存
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              編集
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
