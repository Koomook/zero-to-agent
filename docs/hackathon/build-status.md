# Shelf Coach — Build Status & Roadmap

> Zero to Agent Hackathon (2026-03-22) | Vercel x Google DeepMind
> Tech: Vercel Chat SDK + Gemini (2.5 Flash + 3.1 Flash Image) + Supabase + Slack/Telegram

---

## Phase 1: Foundation — DONE

기본 인프라 + Slack 봇 텍스트 응답 + Supabase 연동 + Vercel 배포

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Next.js 프로젝트 셋업 | DONE | Next.js 16 + Tailwind + TypeScript |
| 1.2 | Vercel Chat SDK 설치 + Slack 어댑터 | DONE | `chat` + `@chat-adapter/slack` |
| 1.3 | Gemini AI SDK 연결 | DONE | `@ai-sdk/google` → `gemini-2.5-flash` |
| 1.4 | Supabase 프로젝트 생성 | DONE | `shelf-coach` (us-west-1) |
| 1.5 | DB 스키마 (task_lists, tasks, task_submissions) | DONE | Migration 적용 완료 |
| 1.6 | Supabase Storage 버킷 | DONE | `shelf-coach` 버킷 (public) |
| 1.7 | Seed data | DONE | Shack15 Event Setup — 5 tasks with expected images |
| 1.8 | API routes (tasks, task-lists, submissions, review) | DONE | 모두 getSupabase() 사용, 라이브 검증 |
| 1.9 | Webhook route `/api/webhooks/[platform]` | DONE | Slack URL verification + after() 패턴 |
| 1.10 | Slack 봇 텍스트 멘션 응답 | DONE | onNewMention → Gemini generateText → thread.post |
| 1.11 | Slack 봇 DM 응답 | DONE | onDirectMessage 핸들러 |
| 1.12 | Slack 봇 스레드 대화 유지 | DONE | thread.subscribe() + onSubscribedMessage |
| 1.13 | 시스템 프롬프트 (대화 모드) | DONE | SYSTEM_PROMPT → generateReply()에서 사용 |
| 1.14 | Vercel 배포 | DONE | `zero-to-agent-hackathon.vercel.app` |
| 1.15 | Vercel env vars 설정 | DONE | 8개 변수 (Slack 2 + Supabase 2 + Gemini 1 + Telegram 2 + Postgres 1) |
| 1.16 | 랜딩 페이지 (/) | DONE | 멀티플랫폼 상태 표시 + Dashboard 링크 |
| 1.17 | 대시보드 기본 UI (/dashboard) | DONE | Task 목록 + Submission 표시 (5초 폴링) |

---

## Phase 2: 이미지 플로우 — DONE

매장 Food Stock 시나리오 — 이미지 수신/분석/생성/발송 + DB 연동

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | 이미지 수신 (attachments + fetchData) | DONE | onSubscribedMessage에서 mimeType 체크 + fetchData() |
| 2.2 | Before 이미지 → Supabase Storage 업로드 | DONE | uploadImage() → `submissions/` 경로 |
| 2.3 | Before 이미지 → Gemini 멀티모달 분석 | DONE | analyzeBeforeImage() — base64 + expected image 비교 |
| 2.4 | AI 가이드 텍스트 생성 → 스레드에 응답 | DONE | thread.post(guide) |
| 2.5 | After 이미지 → Gemini 멀티모달 평가 | DONE | evaluateAfterImage() → score(0-100) + evaluation |
| 2.6 | 평가 결과 → DB 저장 | DONE | ai_score, ai_evaluation, status → updateSubmission() |
| 2.7 | 평가 결과 → 스레드에 점수/피드백 응답 | DONE | formatEvaluation() → thread.post() |
| 2.8 | 이미지를 봇에서 발송 (thread.post with files) | DONE | sendExpectedImage() — Task 할당 시 Expected image 첨부 |
| 2.9 | Gemini 가이드 이미지 생성 | DONE | generateGuideImage() — `gemini-3.1-flash-image-preview` (Nano Banana 2). Before + Expected → "이렇게 되어야 합니다" 이미지 GENERATE |
| 2.10 | 스마트 Task 할당 | DONE | pickNextPendingTask() — 이미 제출된 Task 건너뛰기 + thread별 Task 유지 |
| 2.11 | Task별 시스템 프롬프트 강화 | DONE | SHELF_COACH_SYSTEM + 구조화된 analyze/evaluate 지시 |
| 2.12 | 이미지 mimeType 동적 처리 | DONE | attachment.mimeType 그대로 전달 (jpeg/png/webp 대응) |
| 2.13 | 데모 시나리오 seed data | DONE | Shack15 이벤트 사진 5장 + 구체적 가이드 텍스트 |
| 2.14 | 에러 핸들링 | DONE | try-catch — Gemini 실패, 업로드 실패 시 친화적 메시지 |

---

## Phase 2.5: 스케줄러 + 안정성 — DONE

시나리오 핵심 — 시스템 선발송 + State 영속화 + AI 이미지 생성

**완성된 플로우:**
```
시스템이 1시간마다 (또는 "Send Check Now" 버튼으로) Slack 채널에 Task별 메시지 자동 발송
  → Staff가 해당 스레드에 Before 사진 업로드
  → AI가 Before를 분석 + 텍스트 가이드 생성
  → AI가 "이렇게 되어야 합니다" 가이드 이미지를 Gemini 3.1로 GENERATE해서 스레드에 첨부
  → Staff가 작업 후 After 사진 올림
  → AI가 Expected vs After 비교 평가 (0-100점 + 피드백)
  → Manager가 대시보드에서 OK/Fail 검수
  → 모든 Task OK → Ready to Payout
```

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.5.1 | State adapter 프로덕션 교체 | DONE | `createPostgresState()` — Supabase PostgreSQL (POSTGRES_URL). 서버리스 콜드스타트에도 subscription 유지 |
| 2.5.2 | Vercel Cron Job 설정 | DONE | `vercel.json` cron → `/api/cron/check-tasks` (daily, Hobby plan) |
| 2.5.3 | Chat SDK 프로액티브 메시지 발송 | DONE | `bot.initialize()` → `bot.channel("slack:CHANNEL_ID").post()` → 각 Task별 새 스레드 생성 |
| 2.5.4 | Cron 스레드 → Submission + Subscribe 연결 | DONE | thread_id를 DB에 저장 + `stateAdapter.subscribe(threadId)` 호출 → Staff 이미지 올리면 자동 매칭 |
| 2.5.5 | 대시보드 "Send Check Now" 버튼 | DONE | `?trigger=dashboard` 파라미터로 수동 트리거 |
| 2.5.6 | SLACK_CHANNEL_ID env 설정 | DONE | `C0ANEG8KV33` (#vercel-deepmind-hackathon) |
| 2.5.7 | Gemini 가이드 이미지 생성 | DONE | `generateGuideImage()` — gemini-3.1-flash-image-preview, `responseModalities: ['TEXT', 'IMAGE']`, `result.files` 추출 |
| 2.5.8 | 가이드 이미지 Slack 발송 + DB 저장 | DONE | `thread.post({ files })` + `ai_guide_image_url` 컬럼 |

---

## Phase 3: Admin Dashboard 고도화

매니저가 실제 운영할 수 있는 대시보드

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Task 목록 표시 | DONE | /dashboard에 카드 UI + Expected image 표시 |
| 3.2 | Submission 목록 (Expected/Before/After 이미지 비교) | DONE | 3열 이미지 비교 UI |
| 3.3 | AI 평가 점수 + 피드백 표시 | DONE | ScoreBadge (green/yellow/red) + AI Evaluation 블록 |
| 3.4 | OK/Fail 버튼 (status=reviewed일 때) | DONE | /api/submissions/[id]/review 호출 |
| 3.5 | Ready to Payout 배너 | DONE | 모든 submission ok일 때 표시 |
| 3.6 | "Send Check Now" 버튼 | DONE | 대시보드에서 cron 수동 트리거 |
| **3.7** | **Staff-AI 채팅 히스토리 표시** | **TODO** | **스레드 내용을 DB에 저장하지 않음. 대시보드에서 대화 타임라인 보기** |
| **3.8** | **Task 생성 폼 (대시보드에서 직접)** | **TODO** | **POST /api/tasks 존재하지만 UI 폼 없음. 이미지 업로드 + 가이드 입력** |
| **3.9** | **Task List 생성/관리 UI** | **TODO** | **POST /api/task-lists 존재하지만 UI 없음** |
| **3.10** | **Payout 액션** | **TODO** | **Ready to Payout 표시만 있고, 실제 액션 없음** |
| **3.11** | **AI Guide Image 대시보드 표시** | **TODO** | **ai_guide_image_url이 DB에 저장되지만 대시보드에서 미표시** |

---

## Phase 4: Telegram 연동

Chat SDK 멀티플랫폼 — Slack과 동일 핸들러 코드로 Telegram 지원

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Telegram 어댑터 설치 | DONE | `@chat-adapter/telegram` installed |
| 4.2 | bot.ts 멀티어댑터 초기화 | DONE | createAdapters()에서 env 기반 조건부 등록 |
| 4.3 | Telegram Bot Token 발급 | DONE | BotFather → `@kani_hackathon_bot` |
| 4.4 | Vercel env vars 설정 | DONE | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET_TOKEN` |
| 4.5 | Telegram webhook 등록 | DONE | `setWebhook` API 호출 완료 |
| **4.6** | **이미지 수신/발송 E2E 테스트** | **TODO** | **Before/After 이미지 플로우 검증** |
| **4.7** | **Telegram UX 개선** | **TODO** | **`thread.startTyping()` 추가 등** |

---

## Infrastructure

| 항목 | 값 |
|------|-----|
| Production URL | `https://zero-to-agent-hackathon.vercel.app` |
| Slack Webhook | `https://zero-to-agent-hackathon.vercel.app/api/webhooks/slack` |
| Telegram Webhook | `https://zero-to-agent-hackathon.vercel.app/api/webhooks/telegram` |
| Supabase Project | `shelf-coach` (`fzzylxszhixadihbqqsx`) |
| Supabase Region | us-west-1 |
| DB Tables | `task_lists`, `tasks`, `task_submissions` |
| Storage Bucket | `shelf-coach` (public) |
| State Adapter | `@chat-adapter/state-pg` → Supabase PostgreSQL |
| Slack Channel | `#vercel-deepmind-hackathon` (`C0ANEG8KV33`) |
| Telegram Bot | `@kani_hackathon_bot` |

### Env Variables (Vercel)

```
SLACK_BOT_TOKEN          # Slack Bot OAuth Token
SLACK_SIGNING_SECRET     # Slack App Signing Secret
SLACK_CHANNEL_ID         # Cron 발송 대상 채널
GOOGLE_GENERATIVE_AI_API_KEY  # Gemini API Key
SUPABASE_URL             # Supabase REST API URL
SUPABASE_SERVICE_ROLE_KEY # Supabase Service Role Key
POSTGRES_URL             # PostgreSQL pooler (state-pg용)
TELEGRAM_BOT_TOKEN       # Telegram Bot Token
TELEGRAM_WEBHOOK_SECRET_TOKEN  # Telegram webhook 검증
```

---

## Key Files

| File | Role |
|------|------|
| `src/lib/bot.ts` | Chat SDK 봇 — 멘션/DM/스레드 핸들러, Task 할당, 이미지 플로우 |
| `src/lib/bot-helpers.ts` | 순수 함수 — formatTaskPrompt, formatEvaluation, pickNextPendingTask 등 |
| `src/lib/gemini.ts` | Gemini — analyzeBeforeImage, evaluateAfterImage, generateGuideImage |
| `src/lib/supabase.ts` | Supabase client (lazy init) + 이미지 업로드 |
| `src/lib/env.ts` | 환경변수 검증 (멀티플랫폼) |
| `src/lib/types.ts` | 공유 타입 (TaskList, Task, TaskSubmission) |
| `src/app/dashboard/page.tsx` | Manager 대시보드 (Review Board + Send Check Now) |
| `src/app/api/cron/check-tasks/route.ts` | Cron — 프로액티브 Task 발송 + subscribe |
| `src/app/api/webhooks/[platform]/route.ts` | Chat SDK webhook (Slack/Telegram) |
| `vercel.json` | Vercel Cron 설정 (daily) |

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| ~~`createMemoryState()` 서버리스 비호환~~ | ~~HIGH~~ | **FIXED** — state-pg 교체 |
| ~~getNextPendingTask() 항상 같은 Task 반환~~ | ~~HIGH~~ | **FIXED** |
| ~~이미지 발송 미구현~~ | ~~HIGH~~ | **FIXED** |
| ~~mimeType 하드코딩~~ | ~~MEDIUM~~ | **FIXED** |
| Vercel Hobby plan: cron daily만 가능 | LOW | KNOWN — "Send Check Now" 버튼으로 대체 |

---

## Summary

```
Phase 1   (Foundation):     17/17 DONE  ████████████████ 100%
Phase 2   (Image Flow):     14/14 DONE  ████████████████ 100%
Phase 2.5 (Scheduler+AI):    8/8  DONE  ████████████████ 100%
Phase 3   (Dashboard):       6/11 DONE  █████████░░░░░░░  55%
Phase 4   (Telegram):        5/7  DONE  ███████████░░░░░  71%
```

**Next Priority: Phase 3** — Dashboard에 AI Guide Image 표시 + Task 생성 폼
