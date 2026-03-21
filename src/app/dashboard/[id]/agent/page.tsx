"use client";

import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

type AgentStatus = "active" | "idle" | "error";

interface ChatMessage {
  id: string;
  sender: "staff" | "agent";
  text: string;
  imageUrl?: string;
  timestamp: string;
}

interface Thread {
  id: string;
  taskTitle: string;
  status: AgentStatus;
  lastMessage: string;
  lastTimestamp: string;
  messages: ChatMessage[];
}

interface AgentSession {
  id: string;
  agentName: string;
  staffName: string;
  threads: Thread[];
}

const mockSessions: AgentSession[] = [
  {
    id: "s1",
    agentName: "Evaluator Agent",
    staffName: "Hanako Sato",
    threads: [
      {
        id: "t1",
        taskTitle: "Inventory Check",
        status: "active",
        lastMessage: "Checking drinks section now...",
        lastTimestamp: "14:36",
        messages: [
          { id: "m1", sender: "agent", text: "Hi Hanako, please start the inventory check for aisle 3.", timestamp: "14:30" },
          { id: "m2", sender: "staff", text: "Got it, starting now.", timestamp: "14:31" },
          { id: "m3", sender: "staff", text: "Aisle 3 snacks section — low on chips.", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Low+Stock+Chips", timestamp: "14:35" },
          { id: "m4", sender: "agent", text: "Noted. Added chips to the reorder list. How about the drinks section?", timestamp: "14:35" },
          { id: "m5", sender: "staff", text: "Checking drinks section now...", timestamp: "14:36" },
        ],
      },
      {
        id: "t2",
        taskTitle: "Shelf Organization",
        status: "active",
        lastMessage: "Front displays rearranged. Photo attached.",
        lastTimestamp: "14:20",
        messages: [
          { id: "m6", sender: "agent", text: "Hanako, please reorganize the front displays after the inventory check.", timestamp: "14:00" },
          { id: "m7", sender: "staff", text: "Will do after I finish aisle 3.", timestamp: "14:01" },
          { id: "m8", sender: "staff", text: "Front displays rearranged. Photo attached.", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Shelf+Organized", timestamp: "14:20" },
        ],
      },
      {
        id: "t3",
        taskTitle: "Price Tag Update",
        status: "idle",
        lastMessage: "All price tags updated for this week's sale.",
        lastTimestamp: "13:45",
        messages: [
          { id: "m9", sender: "agent", text: "New sale prices are in. Please update tags on aisle 2 and 5.", timestamp: "13:30" },
          { id: "m10", sender: "staff", text: "Starting with aisle 2.", timestamp: "13:31" },
          { id: "m11", sender: "staff", text: "All price tags updated for this week's sale.", timestamp: "13:45" },
          { id: "m12", sender: "agent", text: "Confirmed. Good work.", timestamp: "13:45" },
        ],
      },
    ],
  },
  {
    id: "s2",
    agentName: "Evaluator Agent",
    staffName: "Taro Tanaka",
    threads: [
      {
        id: "t4",
        taskTitle: "Cash Register Operation",
        status: "active",
        lastMessage: "Great. Please report any issues during the shift.",
        lastTimestamp: "14:10",
        messages: [
          { id: "m13", sender: "agent", text: "Taro, please confirm the register balance for the afternoon handover.", timestamp: "14:00" },
          { id: "m14", sender: "staff", text: "Balance is $1,245. Photo attached.", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Register+Balance", timestamp: "14:02" },
          { id: "m15", sender: "agent", text: "Confirmed. Matches the expected amount.", timestamp: "14:03" },
          { id: "m16", sender: "staff", text: "Handover complete. Afternoon shift starting.", timestamp: "14:10" },
          { id: "m17", sender: "agent", text: "Great. Please report any issues during the shift.", timestamp: "14:10" },
        ],
      },
      {
        id: "t5",
        taskTitle: "Customer Complaint Follow-up",
        status: "active",
        lastMessage: "I'll call the customer back now.",
        lastTimestamp: "14:25",
        messages: [
          { id: "m18", sender: "agent", text: "There's a pending complaint from yesterday — customer #2847. Please follow up.", timestamp: "14:15" },
          { id: "m19", sender: "staff", text: "What was the issue?", timestamp: "14:16" },
          { id: "m20", sender: "agent", text: "They received a damaged product. Offer a replacement or refund.", timestamp: "14:17" },
          { id: "m21", sender: "staff", text: "I'll call the customer back now.", timestamp: "14:25" },
        ],
      },
    ],
  },
  {
    id: "s3",
    agentName: "Quality Agent",
    staffName: "Ichiro Suzuki",
    threads: [
      {
        id: "t6",
        taskTitle: "Store Cleaning",
        status: "idle",
        lastMessage: "Looks good. Task marked as complete.",
        lastTimestamp: "13:06",
        messages: [
          { id: "m22", sender: "agent", text: "Ichiro, please submit the after-cleaning photos for the restroom.", timestamp: "13:00" },
          { id: "m23", sender: "staff", text: "Here you go.", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Restroom+Clean", timestamp: "13:05" },
          { id: "m24", sender: "agent", text: "Looks good. Task marked as complete.", timestamp: "13:06" },
        ],
      },
    ],
  },
  {
    id: "s4",
    agentName: "Review Agent",
    staffName: "Kenta Ito",
    threads: [
      {
        id: "t7",
        taskTitle: "Order Placement",
        status: "error",
        lastMessage: "Error: Unable to process the updated form. Please retry.",
        lastTimestamp: "12:46",
        messages: [
          { id: "m25", sender: "agent", text: "Kenta, the order form has a quantity mismatch on line 4.", timestamp: "12:40" },
          { id: "m26", sender: "staff", text: "Let me check... you're right, it should be 24 not 42.", timestamp: "12:42" },
          { id: "m27", sender: "staff", text: "Updated form attached.", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Updated+Order", timestamp: "12:45" },
          { id: "m28", sender: "agent", text: "Error: Unable to process the updated form. Please retry.", timestamp: "12:46" },
        ],
      },
      {
        id: "t8",
        taskTitle: "Delivery Verification",
        status: "error",
        lastMessage: "Error: Cannot connect to the delivery tracking system.",
        lastTimestamp: "12:30",
        messages: [
          { id: "m29", sender: "agent", text: "Kenta, a delivery arrived. Please verify the contents against the order.", timestamp: "12:20" },
          { id: "m30", sender: "staff", text: "Checking now. 3 boxes received.", imageUrl: "https://placehold.co/400x300/e2e8f0/475569?text=Delivery+Boxes", timestamp: "12:25" },
          { id: "m31", sender: "agent", text: "Error: Cannot connect to the delivery tracking system.", timestamp: "12:30" },
        ],
      },
    ],
  },
];

const statusStyles: Record<AgentStatus, { badge: string; dot: string }> = {
  active: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    dot: "bg-emerald-500 animate-pulse",
  },
  idle: {
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
  error: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export default function AgentPage() {
  const { t } = useI18n();
  const [selectedSessionId, setSelectedSessionId] = useState<string>(mockSessions[0].id);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(mockSessions[0].threads[0].id);

  const selectedSession = mockSessions.find((s) => s.id === selectedSessionId)!;
  const selectedThread = selectedSession.threads.find((th) => th.id === selectedThreadId);

  const handleSelectSession = (session: AgentSession) => {
    setSelectedSessionId(session.id);
    setSelectedThreadId(session.threads[0].id);
  };

  const statusLabel: Record<AgentStatus, string> = {
    active: t.agent.active,
    idle: t.agent.idle,
    error: t.agent.error,
  };

  const activeCount = (session: AgentSession) =>
    session.threads.filter((th) => th.status === "active").length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Column 1: Staff sessions */}
      <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h1 className="text-sm font-bold">{t.agent.title}</h1>
        </div>
        <div className="space-y-0.5 p-2">
          {mockSessions.map((session) => {
            const hasActive = session.threads.some((th) => th.status === "active");
            const hasError = session.threads.some((th) => th.status === "error");
            const dotClass = hasError
              ? statusStyles.error.dot
              : hasActive
                ? statusStyles.active.dot
                : statusStyles.idle.dot;

            return (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session)}
                className={`w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                  selectedSessionId === session.id
                    ? "bg-zinc-200 dark:bg-zinc-800"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                  <span className="text-sm font-medium">{session.staffName}</span>
                </div>
                <div className="mt-0.5 pl-4 text-[10px] text-zinc-400">
                  {session.agentName} · {activeCount(session)} active
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Column 2: Threads (tasks) for selected staff */}
      <div className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-bold">{selectedSession.staffName}</h2>
          <p className="text-[10px] text-zinc-400">{selectedSession.threads.length} threads</p>
        </div>
        <div className="space-y-0.5 p-2">
          {selectedSession.threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className={`w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                selectedThreadId === thread.id
                  ? "bg-zinc-200 dark:bg-zinc-800"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusStyles[thread.status].dot}`} />
                <span className="text-sm font-medium">{thread.taskTitle}</span>
              </div>
              <p className="mt-1 truncate pl-4 text-xs text-zinc-500">{thread.lastMessage}</p>
              <p className="mt-0.5 pl-4 text-[10px] text-zinc-400">{thread.lastTimestamp}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Column 3: Conversation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedThread ? (
          <>
            <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
              <span className={`h-2 w-2 rounded-full ${statusStyles[selectedThread.status].dot}`} />
              <div>
                <h3 className="text-sm font-semibold">{selectedThread.taskTitle}</h3>
                <p className="text-[10px] text-zinc-400">
                  {selectedSession.staffName} · {selectedSession.agentName}
                </p>
              </div>
              <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${statusStyles[selectedThread.status].badge}`}>
                {statusLabel[selectedThread.status]}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {selectedThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "staff" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
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
                      <Image
                        src={msg.imageUrl}
                        alt="Chat attachment"
                        width={400}
                        height={300}
                        className="mt-2 h-auto rounded-md border border-zinc-200 dark:border-zinc-700"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
