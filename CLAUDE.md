# CLAUDE.md — Shelf Coach

> Zero to Agent Hackathon (2026-03-22) | Vercel x Google DeepMind
> AI-powered operational assistant for on-site task management via Slack/Telegram/WhatsApp

## Project Overview

Shelf Coach는 현장 작업(음식 채우기, 테이블 정리 등)을 이미지 기반으로 운영하는 멀티모달 에이전트 시스템.
Manager가 Task를 정의하면, Staff가 Slack/Telegram/WhatsApp에서 봇과 대화하며 Before/After 이미지를 제출하고,
AI가 가이드 생성 + 평가하며, Manager가 대시보드에서 최종 검수한다.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + Tailwind CSS 4 |
| Bot SDK | `chat` (Vercel Chat SDK) + `@chat-adapter/slack`, `telegram`, `whatsapp` |
| AI | `@ai-sdk/google` → `gemini-2.5-flash` |
| DB | Supabase (PostgreSQL + Storage) |
| State | `@chat-adapter/state-memory` |
| Deploy | Vercel |

## Build Status

**반드시 참조**: [docs/hackathon/build-status.md](docs/hackathon/build-status.md)

현재 Phase별 진행률:
- Phase 1 (Foundation): 100% DONE
- Phase 2 (Slack Image Flow): 진행중
- Phase 3 (Dashboard): 미착수
- Phase 4 (Multi-Platform): 미착수

## Key Files

| File | Role |
|------|------|
| `src/lib/bot.ts` | Chat SDK 봇 — 멘션/DM/스레드 핸들러, Task 할당, 이미지 플로우 |
| `src/lib/gemini.ts` | Gemini 멀티모달 — analyzeBeforeImage, evaluateAfterImage |
| `src/lib/supabase.ts` | Supabase client (lazy init) + 이미지 업로드 |
| `src/lib/env.ts` | 환경변수 검증 (멀티플랫폼) |
| `src/lib/types.ts` | 공유 타입 (TaskList, Task, TaskSubmission) |
| `src/app/dashboard/page.tsx` | Manager 대시보드 (Review Board) |
| `src/app/api/webhooks/[platform]/route.ts` | Chat SDK webhook (Slack/Telegram/WhatsApp) |
| `src/app/api/tasks/route.ts` | Task CRUD API |
| `src/app/api/submissions/route.ts` | Submission 조회 |
| `src/app/api/submissions/[id]/review/route.ts` | Manager OK/Fail API |

## Supabase

- Project: `shelf-coach` (fzzylxszhixadihbqqsx)
- Region: us-west-1
- Tables: `task_lists`, `tasks`, `task_submissions`
- Storage: `shelf-coach` bucket (public)
- Schema: `supabase/schema.sql`

## Deployment

- Production: `https://zero-to-agent-hackathon.vercel.app`
- Webhook: `https://zero-to-agent-hackathon.vercel.app/api/webhooks/slack`

## Dev Notes

- 셸에 `SUPABASE_URL` env가 old project로 설정되어 있음. `unset SUPABASE_URL && unset SUPABASE_KEY` 후 `pnpm dev` 실행
- Vercel deploy 시 env vars는 프로젝트 설정에 등록되어 있음 (5개)
- `chat-demo-app/` 디렉토리는 빈 스캐폴드 — 무시

## Commands

```bash
pnpm dev          # 로컬 개발 서버
pnpm build        # 프로덕션 빌드
vercel deploy --prod  # Vercel 배포
```
