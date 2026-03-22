import Link from "next/link";

import { getBotRuntimeStatus } from "@/lib/env";

export default function Home() {
  const status = getBotRuntimeStatus();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef4ff,white_45%)] px-6 py-16 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Vercel Chat SDK x Gemini x Multi-Platform
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Kani
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            AI-powered operational assistant. Staff upload photos via
            Slack/Telegram/WhatsApp, AI guides them to the goal state, and
            managers review everything on a single dashboard.
          </p>
          <Link
            href="/dashboard"
            className="mt-2 inline-block w-fit rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Open Dashboard
          </Link>
        </div>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)]">
            <h2 className="text-xl font-semibold">How it works</h2>
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>
                1. Manager creates a Task List with expected images and guides.
              </li>
              <li>
                2. Staff mentions the bot in Slack, Telegram, or WhatsApp.
              </li>
              <li>3. Bot assigns a task and asks for a Before photo.</li>
              <li>
                4. AI analyzes the photo and generates actionable guidance.
              </li>
              <li>5. Staff completes the task and uploads an After photo.</li>
              <li>6. AI scores the result (0-100) with feedback.</li>
              <li>
                7. Manager reviews on Dashboard and approves or rejects.
              </li>
              <li>
                8. All tasks approved = Ready to Payout.
              </li>
            </ol>

            <div className="mt-8 rounded-2xl bg-slate-950 p-5 text-sm text-slate-100">
              <p className="font-medium text-slate-300">Webhook endpoints</p>
              <code className="mt-2 block text-sky-300">
                POST {status.webhookPath}/slack
              </code>
              <code className="mt-1 block text-sky-300">
                POST {status.webhookPath}/telegram
              </code>
              <code className="mt-1 block text-sky-300">
                POST {status.webhookPath}/whatsapp
              </code>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-xl font-semibold">Runtime status</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-2xl bg-white p-4">
                <p className="font-medium text-slate-900">Core env</p>
                <p className="mt-2 text-slate-600">
                  {status.missing.length === 0
                    ? "Ready"
                    : `Missing: ${status.missing.join(", ")}`}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="font-medium text-slate-900">
                  Active platforms
                </p>
                <p className="mt-2 text-slate-600">
                  {status.platforms.length > 0
                    ? status.platforms.join(", ")
                    : "No platform configured"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="font-medium text-slate-900">Flow</p>
                <p className="mt-2 text-slate-600">
                  Mention bot &rarr; Before photo &rarr; AI guide &rarr; After
                  photo &rarr; AI score &rarr; Manager review
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
