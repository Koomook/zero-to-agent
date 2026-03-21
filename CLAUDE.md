# CLAUDE.md — Shelf Coach

> Zero to Agent Hackathon (2026-03-22) | Vercel x Google DeepMind
> AI-powered operational assistant for on-site task management via Slack/Telegram

## Project Overview

Shelf Coach는 현장 작업(음식 채우기, 테이블 정리 등)을 이미지 기반으로 운영하는 멀티모달 에이전트 시스템.
시스템이 주기적으로 Slack에 점검 메시지를 발송하고, Staff가 Before 사진을 올리면 AI가 가이드 이미지를 생성하고,
After 사진으로 평가한 뒤 Manager가 대시보드에서 최종 검수한다.

## Core Flow

```
시스템 자동 발송 (Cron or "Send Check Now")
  → Staff가 스레드에 Before 사진 업로드
  → Gemini 2.5 Flash: 텍스트 가이드 생성 (analyzeBeforeImage)
  → Gemini 3.1 Flash Image: 가이드 이미지 GENERATE (generateGuideImage)
  → Staff가 After 사진 업로드
  → Gemini 2.5 Flash: 평가 + 점수 (evaluateAfterImage)
  → Manager Dashboard에서 OK/Fail 검수
  → 전부 OK → Ready to Payout
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + Tailwind CSS 4 |
| Bot SDK | `chat` (Vercel Chat SDK) + `@chat-adapter/slack`, `telegram` |
| AI (텍스트) | `@ai-sdk/google` → `gemini-2.5-flash` |
| AI (이미지 생성) | `@ai-sdk/google` → `gemini-3.1-flash-image-preview` (Nano Banana 2) |
| DB | Supabase (PostgreSQL + Storage) |
| State | `@chat-adapter/state-pg` → Supabase PostgreSQL (서버리스 영속) |
| Deploy | Vercel |

## Build Status

**반드시 참조**: [docs/hackathon/build-status.md](docs/hackathon/build-status.md)

```
Phase 1   (Foundation):     17/17  100%  DONE
Phase 2   (Image Flow):     14/14  100%  DONE
Phase 2.5 (Scheduler+AI):    8/8  100%  DONE
Phase 3   (Dashboard):       6/11  55%
Phase 4   (Telegram):        5/7   71%
```

## Key Files

| File | Role |
|------|------|
| `src/lib/bot.ts` | Chat SDK 봇 — 멘션/DM/스레드 핸들러, Task 할당, 이미지 플로우 |
| `src/lib/bot-helpers.ts` | 순수 함수 — formatTaskPrompt, formatEvaluation, pickNextPendingTask 등 |
| `src/lib/gemini.ts` | Gemini — analyzeBeforeImage, evaluateAfterImage, **generateGuideImage** |
| `src/lib/supabase.ts` | Supabase client (lazy init) + 이미지 업로드 |
| `src/lib/env.ts` | 환경변수 검증 (멀티플랫폼) |
| `src/lib/types.ts` | 공유 타입 (TaskList, Task, TaskSubmission) |
| `src/app/dashboard/page.tsx` | Manager 대시보드 (Review Board + Send Check Now) |
| `src/app/api/cron/check-tasks/route.ts` | Cron — 프로액티브 Task 발송 + subscribe |
| `src/app/api/webhooks/[platform]/route.ts` | Chat SDK webhook (Slack/Telegram) |
| `src/app/api/tasks/route.ts` | Task CRUD API |
| `src/app/api/submissions/route.ts` | Submission 조회 |
| `src/app/api/submissions/[id]/review/route.ts` | Manager OK/Fail API |
| `vercel.json` | Vercel Cron 설정 (daily) |

## Supabase

- Project: `shelf-coach` (`fzzylxszhixadihbqqsx`)
- Region: us-west-1
- Tables: `task_lists`, `tasks`, `task_submissions`
- Storage: `shelf-coach` bucket (public) — expected images + submissions
- Schema: `supabase/schema.sql`
- Pooler: `aws-1-us-west-1.pooler.supabase.com:5432` (session mode)

## Deployment

| 항목 | URL |
|------|-----|
| Production | `https://zero-to-agent-hackathon.vercel.app` |
| Dashboard | `https://zero-to-agent-hackathon.vercel.app/dashboard` |
| Slack Webhook | `https://zero-to-agent-hackathon.vercel.app/api/webhooks/slack` |
| Telegram Webhook | `https://zero-to-agent-hackathon.vercel.app/api/webhooks/telegram` |
| Cron (manual) | `https://zero-to-agent-hackathon.vercel.app/api/cron/check-tasks?trigger=dashboard` |

## Env Variables (Vercel에 등록됨)

```
SLACK_BOT_TOKEN              # Slack Bot OAuth Token
SLACK_SIGNING_SECRET         # Slack App Signing Secret
SLACK_CHANNEL_ID             # Cron 발송 대상 채널 (C0ANEG8KV33)
GOOGLE_GENERATIVE_AI_API_KEY # Gemini API Key
SUPABASE_URL                 # Supabase REST API URL
SUPABASE_SERVICE_ROLE_KEY    # Supabase Service Role Key
POSTGRES_URL                 # PostgreSQL pooler (state-pg용)
TELEGRAM_BOT_TOKEN           # Telegram Bot Token
TELEGRAM_WEBHOOK_SECRET_TOKEN # Telegram webhook 검증
```

## Key References

### Vercel 배포
- `vercel deploy --prod` — env vars는 Vercel 프로젝트 설정에 등록되어 있음 (9개)
- `vercel.json` — Cron Job 설정 (`/api/cron/check-tasks`, daily)
- Vercel Hobby plan 제약: cron은 daily만 가능 (hourly는 Pro 필요)
- Deployment Protection은 OFF (Slack webhook 수신 위해)

### Supabase Schema
- **`supabase/schema.sql`** — 전체 DDL (task_lists, tasks, task_submissions)
- `task_submissions.ai_guide_image_url` — Gemini가 생성한 가이드 이미지 URL (Phase 2.5에서 추가)
- Storage bucket `shelf-coach` — public read, expected images(`expected/`) + submissions(`submissions/`)
- Supabase MCP 사용 가능: `mcp__plugin_supabase_supabase__execute_sql`, `apply_migration` 등

### Chat SDK 사용 패턴
- **Webhook**: `src/app/api/webhooks/[platform]/route.ts` — `bot.webhooks[platform](request, { waitUntil })` + Next.js `after()`
- **이벤트 핸들러**: `onNewMention`, `onDirectMessage`, `onSubscribedMessage` (bot.ts)
- **프로액티브 발송**: `bot.initialize()` → `bot.channel("slack:CHANNEL_ID").post()` (cron route)
- **스레드 subscribe**: `stateAdapter.subscribe(threadId)` — Slack threadId 형식: `slack:CHANNEL:TS`
- **파일 발송**: `thread.post({ markdown: "...", files: [{ data: Buffer, filename, mimeType }] })`
- **이미지 수신**: `message.attachments` → `fetchData()` → Buffer
- **State**: `createPostgresState()` — `POSTGRES_URL` env로 Supabase PostgreSQL에 subscription 영속

## Dev Notes

- 셸에 `SUPABASE_URL` env가 old project(`qmmvztkmvyeqljuhjtgi`)로 설정되어 있음. `unset SUPABASE_URL && unset SUPABASE_KEY` 후 `pnpm dev` 실행
- Vercel Hobby plan: cron은 daily만 가능. "Send Check Now" 버튼으로 수동 트리거
- Supabase pooler host: `aws-1` (not `aws-0`)
- `chat-demo-app/` 디렉토리는 빈 스캐폴드 — 무시
- `test-images/resized/` — 리사이즈된 데모 이미지 (800px, ~140KB)

## Commands

```bash
pnpm dev                    # 로컬 개발 서버 (unset SUPABASE_URL 먼저!)
pnpm build                  # 프로덕션 빌드
vercel deploy --prod        # Vercel 배포
curl ".../api/cron/check-tasks?trigger=dashboard"  # 수동 Task 발송
```
