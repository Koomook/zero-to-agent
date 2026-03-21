"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

type EvaluationStatus = "pending" | "approved" | "rejected" | "agent_auto" | "agent_approved" | "agent_rejected";

interface ChatMessage {
  id: string;
  sender: "staff" | "agent";
  text: string;
  imageUrl?: string;
  timestamp: string;
}

interface Evaluation {
  id: string;
  staffName: string;
  taskTitle: string;
  status: EvaluationStatus;
  chatLog: ChatMessage[];
}

const initialEvaluations: Evaluation[] = [
  {
    id: "1",
    staffName: "Taro Tanaka",
    taskTitle: "Cash Register Operation",
    status: "pending",
    chatLog: [
      { id: "m1", sender: "staff", text: "レジの開店準備が完了しました。", timestamp: "09:00" },
      { id: "m2", sender: "agent", text: "確認しました。レジの初期金額は合っていますか？", timestamp: "09:01" },
      { id: "m3", sender: "staff", text: "はい、30,000円でセット済みです。写真を添付します。", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Register+Setup", timestamp: "09:02" },
      { id: "m4", sender: "agent", text: "写真を確認しました。問題ありません。午前シフトを開始してください。", timestamp: "09:03" },
      { id: "m5", sender: "staff", text: "午前シフト完了しました。売上報告書を添付します。", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Sales+Report+AM", timestamp: "12:30" },
      { id: "m6", sender: "agent", text: "午前の売上を確認しました。午後もよろしくお願いします。", timestamp: "12:31" },
    ],
  },
  {
    id: "2",
    staffName: "Hanako Sato",
    taskTitle: "Inventory Check",
    status: "pending",
    chatLog: [
      { id: "m7", sender: "staff", text: "食品棚の確認を開始します。", timestamp: "10:00" },
      { id: "m8", sender: "agent", text: "了解です。不足品があれば写真付きで報告してください。", timestamp: "10:01" },
      { id: "m9", sender: "staff", text: "カップ麺の在庫が残り3個です。", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Low+Stock+Noodles", timestamp: "10:15" },
      { id: "m10", sender: "agent", text: "発注リストに追加しました。他に不足はありますか？", timestamp: "10:16" },
    ],
  },
  {
    id: "3",
    staffName: "Ichiro Suzuki",
    taskTitle: "Store Cleaning",
    status: "pending",
    chatLog: [
      { id: "m11", sender: "staff", text: "店内清掃を完了しました。", timestamp: "08:30" },
      { id: "m12", sender: "agent", text: "ビフォーアフターの写真をお願いします。", timestamp: "08:31" },
      { id: "m13", sender: "staff", text: "清掃前後の写真です。", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Before+Cleaning", timestamp: "08:32" },
      { id: "m14", sender: "staff", text: "", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=After+Cleaning", timestamp: "08:32" },
      { id: "m15", sender: "agent", text: "きれいになっていますね。次はトイレ清掃をお願いします。", timestamp: "08:33" },
    ],
  },
  {
    id: "4",
    staffName: "Misaki Takahashi",
    taskTitle: "Customer Service",
    status: "approved",
    chatLog: [
      { id: "m16", sender: "staff", text: "接客対応のシフトに入ります。", timestamp: "11:00" },
      { id: "m17", sender: "agent", text: "本日のキャンペーン情報を確認してください。", timestamp: "11:01" },
    ],
  },
  {
    id: "5",
    staffName: "Kenta Ito",
    taskTitle: "Order Placement",
    status: "rejected",
    chatLog: [
      { id: "m18", sender: "staff", text: "発注作業を開始します。", timestamp: "14:00" },
      { id: "m19", sender: "agent", text: "発注リストを確認してください。", timestamp: "14:01" },
      { id: "m20", sender: "staff", text: "発注書を提出します。", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Order+Form", timestamp: "14:30" },
      { id: "m21", sender: "agent", text: "数量に誤りがあります。修正をお願いします。", timestamp: "14:31" },
    ],
  },
];

const statusBadge: Record<EvaluationStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  agent_auto: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  agent_approved: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  agent_rejected: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function EvaluationsPage() {
  const { t } = useI18n();
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statusLabelMap: Record<EvaluationStatus, string> = {
    pending: t.evaluations.pending,
    approved: t.evaluations.approved,
    rejected: t.evaluations.rejected,
    agent_auto: t.evaluations.agentAuto,
    agent_approved: t.evaluations.agentApproved,
    agent_rejected: t.evaluations.agentRejected,
  };

  const handleAction = (id: string, status: EvaluationStatus) => {
    setEvaluations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  };

  const selectedEvaluation = evaluations.find((e) => e.id === selectedId);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Table */}
      <div className={`flex-1 overflow-auto p-8 ${selectedId ? "border-r border-zinc-200 dark:border-zinc-800" : ""}`}>
        <h1 className="mb-6 text-2xl font-bold">{t.evaluations.title}</h1>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">{t.evaluations.staff}</th>
                <th className="px-4 py-3 font-medium">{t.evaluations.task}</th>
                <th className="px-4 py-3 font-medium">{t.evaluations.status}</th>
                <th className="px-4 py-3 font-medium text-right">{t.evaluations.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {evaluations.map((ev) => (
                <tr
                  key={ev.id}
                  className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${selectedId === ev.id ? "bg-zinc-100 dark:bg-zinc-900" : ""}`}
                  onClick={() => setSelectedId(selectedId === ev.id ? null : ev.id)}
                >
                  <td className="px-4 py-3">{ev.staffName}</td>
                  <td className="px-4 py-3">{ev.taskTitle}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadge[ev.status]}`}
                    >
                      {statusLabelMap[ev.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {ev.status === "pending" ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          onClick={() => handleAction(ev.id, "approved")}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                          {t.evaluations.approve}
                        </button>
                        <button
                          onClick={() => handleAction(ev.id, "rejected")}
                          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
                        >
                          {t.evaluations.reject}
                        </button>
                        <button
                          onClick={() => handleAction(ev.id, "agent_auto")}
                          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          {t.evaluations.agentAuto}
                        </button>
                        <button
                          onClick={() => handleAction(ev.id, "agent_approved")}
                          className="rounded-md bg-teal-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                        >
                          {t.evaluations.agentApprove}
                        </button>
                        <button
                          onClick={() => handleAction(ev.id, "agent_rejected")}
                          className="rounded-md bg-orange-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-orange-700"
                        >
                          {t.evaluations.agentReject}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAction(ev.id, "pending")}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        {t.common.reset}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Chat Log Panel */}
      {selectedEvaluation && (
        <div className="flex w-96 shrink-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold">{selectedEvaluation.staffName}</h2>
              <p className="text-xs text-zinc-500">{selectedEvaluation.taskTitle}</p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {selectedEvaluation.chatLog.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "staff" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender === "staff"
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase opacity-60">
                      {msg.sender === "staff" ? t.evaluations.chatStaff : t.evaluations.chatAgent}
                    </span>
                    <span className="text-[10px] opacity-40">{msg.timestamp}</span>
                  </div>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Chat attachment"
                      className="mt-2 rounded-md border border-zinc-200 dark:border-zinc-700"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
