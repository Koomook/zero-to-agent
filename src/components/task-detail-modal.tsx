"use client";

import { useState } from "react";
import { Task, Staff, Priority, TaskStatus, EvaluatorType } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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

  const priorityLabel = {
    low: t.tasks.priorityLow,
    medium: t.tasks.priorityMedium,
    high: t.tasks.priorityHigh,
  };
  const statusLabel = {
    pending: t.tasks.statusPending,
    in_progress: t.tasks.statusInProgress,
    completed: t.tasks.statusCompleted,
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
            <span className="text-zinc-500">{t.tasks.assignee}: </span>
            {editing ? (
              <select
                className={inputClass + " mt-1"}
                value={draft.assigneeId}
                onChange={(e) =>
                  setDraft({ ...draft, assigneeId: e.target.value })
                }
              >
                <option value="">{t.common.unassigned}</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              staffList.find((s) => s.id === task.assigneeId)?.name ?? t.common.unassigned
            )}
          </div>
          <div>
            <span className="text-zinc-500">{t.tasks.priority}: </span>
            {editing ? (
              <select
                className={inputClass + " mt-1"}
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value as Priority })
                }
              >
                <option value="low">{t.tasks.priorityLow}</option>
                <option value="medium">{t.tasks.priorityMedium}</option>
                <option value="high">{t.tasks.priorityHigh}</option>
              </select>
            ) : (
              priorityLabel[task.priority]
            )}
          </div>
          <div>
            <span className="text-zinc-500">{t.tasks.status}: </span>
            {editing ? (
              <select
                className={inputClass + " mt-1"}
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as TaskStatus })
                }
              >
                <option value="pending">{t.tasks.statusPending}</option>
                <option value="in_progress">{t.tasks.statusInProgress}</option>
                <option value="completed">{t.tasks.statusCompleted}</option>
              </select>
            ) : (
              statusLabel[task.status]
            )}
          </div>
          <div>
            <span className="text-zinc-500">{t.tasks.dueDate}: </span>
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
              task.dueDate || t.common.notSet
            )}
          </div>
          <div>
            <span className="text-zinc-500">{t.tasks.evaluator}: </span>
            {editing ? (
              <select
                className={inputClass + " mt-1"}
                value={draft.evaluator}
                onChange={(e) =>
                  setDraft({ ...draft, evaluator: e.target.value as EvaluatorType })
                }
              >
                <option value="human">{t.common.human}</option>
                <option value="agent_auto">{t.common.agentAuto}</option>
              </select>
            ) : (
              <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${task.evaluator === "agent_auto" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                {task.evaluator === "agent_auto" ? t.common.agentAuto : t.common.human}
              </span>
            )}
          </div>
          <div>
            <span className="text-zinc-500">{t.rewards.hours}: </span>
            {editing ? (
              <input
                type="number"
                className={inputClass + " mt-1"}
                value={draft.rewardHours}
                onChange={(e) =>
                  setDraft({ ...draft, rewardHours: Number(e.target.value) })
                }
              />
            ) : (
              task.rewardHours > 0 ? `${task.rewardHours}h` : t.common.notSet
            )}
          </div>
          <div>
            <span className="text-zinc-500">{t.rewards.amount}: </span>
            {editing ? (
              <input
                type="number"
                className={inputClass + " mt-1"}
                value={draft.rewardAmount}
                onChange={(e) =>
                  setDraft({ ...draft, rewardAmount: Number(e.target.value) })
                }
              />
            ) : (
              task.rewardAmount > 0 ? `$${task.rewardAmount}` : t.common.notSet
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>{t.tasks.achievements}</span>
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
                        {t.common.delete}
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
                placeholder={t.tasks.newAchievement}
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAchievement()}
              />
              <button
                onClick={addAchievement}
                className="rounded-md bg-zinc-200 px-3 py-1 text-sm font-medium hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                {t.common.add}
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
                {t.common.cancel}
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {t.common.save}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {t.common.edit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
