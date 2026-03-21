"use client";

import { useState } from "react";

type EvaluationStatus = "pending" | "approved" | "rejected";

interface Evaluation {
  id: string;
  staffName: string;
  taskTitle: string;
  status: EvaluationStatus;
}

const initialEvaluations: Evaluation[] = [
  { id: "1", staffName: "Taro Tanaka", taskTitle: "Cash Register Operation", status: "pending" },
  { id: "2", staffName: "Hanako Sato", taskTitle: "Inventory Check", status: "pending" },
  { id: "3", staffName: "Ichiro Suzuki", taskTitle: "Store Cleaning", status: "pending" },
  { id: "4", staffName: "Misaki Takahashi", taskTitle: "Customer Service", status: "approved" },
  { id: "5", staffName: "Kenta Ito", taskTitle: "Order Placement", status: "rejected" },
];

const statusBadge: Record<EvaluationStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabel: Record<EvaluationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState(initialEvaluations);

  const handleAction = (id: string, status: EvaluationStatus) => {
    setEvaluations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  };

  return (
    <div className="flex-1 p-8">
      <h1 className="mb-6 text-2xl font-bold">Evaluations</h1>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">Staff</th>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {evaluations.map((ev) => (
              <tr key={ev.id}>
                <td className="px-4 py-3">{ev.staffName}</td>
                <td className="px-4 py-3">{ev.taskTitle}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadge[ev.status]}`}
                  >
                    {statusLabel[ev.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {ev.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAction(ev.id, "approved")}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(ev.id, "rejected")}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAction(ev.id, "pending")}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      Reset
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
