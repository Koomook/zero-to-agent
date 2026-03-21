"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Reward } from "@/lib/types";

const mockStaff = [
  { id: "1", name: "Taro Tanaka" },
  { id: "2", name: "Hanako Sato" },
  { id: "3", name: "Ichiro Suzuki" },
  { id: "4", name: "Misaki Takahashi" },
  { id: "5", name: "Kenta Ito" },
];

const mockTasks = [
  { id: "1", title: "Cash Register Operation", assigneeId: "1" },
  { id: "2", title: "Inventory Check", assigneeId: "2" },
  { id: "3", title: "Store Cleaning", assigneeId: "3" },
  { id: "4", title: "Customer Service", assigneeId: "1" },
  { id: "5", title: "Order Placement", assigneeId: "5" },
];

const initialRewards: Reward[] = [
  { id: "r1", taskId: "1", hours: 8, amount: 120, note: "Full shift", createdAt: "2026-03-20" },
  { id: "r2", taskId: "2", hours: 4, amount: 60, note: "Morning only", createdAt: "2026-03-21" },
  { id: "r3", taskId: "4", hours: 3, amount: 45, note: "", createdAt: "2026-03-22" },
];

export default function StaffPage() {
  const { t } = useI18n();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ hours: "", amount: "", note: "" });

  const selectedStaff = mockStaff.find((s) => s.id === selectedStaffId);
  const staffTasks = mockTasks.filter((tk) => tk.assigneeId === selectedStaffId);

  const getRewardForTask = (taskId: string) => rewards.find((r) => r.taskId === taskId);

  const staffTotalHours = staffTasks.reduce((sum, tk) => {
    const r = getRewardForTask(tk.id);
    return sum + (r?.hours ?? 0);
  }, 0);

  const staffTotalAmount = staffTasks.reduce((sum, tk) => {
    const r = getRewardForTask(tk.id);
    return sum + (r?.amount ?? 0);
  }, 0);

  const handleSaveReward = (taskId: string) => {
    if (!draft.hours || !draft.amount) return;
    const existing = getRewardForTask(taskId);
    if (existing) {
      setRewards((prev) =>
        prev.map((r) =>
          r.id === existing.id
            ? { ...r, hours: Number(draft.hours), amount: Number(draft.amount), note: draft.note }
            : r
        )
      );
    } else {
      setRewards((prev) => [
        ...prev,
        {
          id: `r-${Date.now()}`,
          taskId,
          hours: Number(draft.hours),
          amount: Number(draft.amount),
          note: draft.note,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ]);
    }
    setEditingTaskId(null);
    setDraft({ hours: "", amount: "", note: "" });
  };

  const startEdit = (taskId: string) => {
    const existing = getRewardForTask(taskId);
    setEditingTaskId(taskId);
    setDraft({
      hours: existing ? String(existing.hours) : "",
      amount: existing ? String(existing.amount) : "",
      note: existing?.note ?? "",
    });
  };

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Staff list */}
      <div className={`flex-1 overflow-auto p-8 ${selectedStaffId ? "border-r border-zinc-200 dark:border-zinc-800" : ""}`}>
        <h1 className="mb-6 text-2xl font-bold">{t.staffPage.title}</h1>
        <ul className="space-y-2">
          {mockStaff.map((staff) => {
            const tasks = mockTasks.filter((tk) => tk.assigneeId === staff.id);
            const total = tasks.reduce((sum, tk) => {
              const r = getRewardForTask(tk.id);
              return sum + (r?.amount ?? 0);
            }, 0);

            return (
              <li
                key={staff.id}
                onClick={() => setSelectedStaffId(selectedStaffId === staff.id ? null : staff.id)}
                className={`flex cursor-pointer items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 ${
                  selectedStaffId === staff.id ? "bg-zinc-100 dark:bg-zinc-900" : ""
                }`}
              >
                <span>{staff.name}</span>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{tasks.length} {t.nav.tasks.toLowerCase()}</span>
                  {total > 0 && <span className="font-medium text-emerald-600 dark:text-emerald-400">${total}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right: Tasks + Rewards for selected staff */}
      {selectedStaff && (
        <div className="flex w-96 shrink-0 flex-col overflow-hidden">
          <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <h2 className="font-semibold">{selectedStaff.name}</h2>
            <p className="text-xs text-zinc-500">
              {staffTasks.length} {t.nav.tasks.toLowerCase()} · {staffTotalHours}h · ${staffTotalAmount}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {staffTasks.length === 0 ? (
              <p className="text-sm text-zinc-500">{t.rewards.noRewards}</p>
            ) : (
              <div className="space-y-3">
                {staffTasks.map((task) => {
                  const reward = getRewardForTask(task.id);
                  const isEditing = editingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{task.title}</span>
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(task.id)}
                            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          >
                            {t.common.edit}
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              className={inputClass + " w-full"}
                              placeholder={t.rewards.hours}
                              value={draft.hours}
                              onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
                            />
                            <input
                              type="number"
                              className={inputClass + " w-full"}
                              placeholder={t.rewards.amount}
                              value={draft.amount}
                              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                            />
                          </div>
                          <input
                            className={inputClass + " w-full"}
                            placeholder={t.rewards.note}
                            value={draft.note}
                            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                            >
                              {t.common.cancel}
                            </button>
                            <button
                              onClick={() => handleSaveReward(task.id)}
                              className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                              {t.common.save}
                            </button>
                          </div>
                        </div>
                      ) : reward ? (
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>{reward.hours}h</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">${reward.amount}</span>
                          {reward.note && <span>{reward.note}</span>}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">{t.common.notSet}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
