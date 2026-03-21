# Shelf Coach — Build Status & Roadmap

> Zero to Agent Hackathon (2026-03-22) | Vercel x Google DeepMind
> Tech: Vercel Chat SDK + Gemini 2.5 Flash + Supabase + Slack/Telegram/WhatsApp

---

## Phase 1: Foundation (CURRENT)

기본 인프라 + Slack 봇 텍스트 응답 + Supabase 연동 + Vercel 배포

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Next.js 프로젝트 셋업 | DONE | Next.js 16 + Tailwind + TypeScript |
| 1.2 | Vercel Chat SDK 설치 + Slack 어댑터 | DONE | `chat` + `@chat-adapter/slack` |
| 1.3 | Gemini AI SDK 연결 | DONE | `@ai-sdk/google` → `gemini-2.5-flash` |
| 1.4 | Supabase 프로젝트 생성 | DONE | `shelf-coach` (us-west-1) |
| 1.5 | DB 스키마 (task_lists, tasks, task_submissions) | DONE | Migration 적용 완료 |
| 1.6 | Supabase Storage 버킷 | DONE | `shelf-coach` 버킷 (public) |
| 1.7 | Seed data (Cafe Daily Checklist + 3 tasks) | DONE | 4 tasks 존재 |
| 1.8 | API routes (tasks, task-lists, submissions, review) | DONE | 모두 getSupabase() 사용, 라이브 검증 |
| 1.9 | Webhook route `/api/webhooks/[platform]` | DONE | Slack URL verification + after() 패턴 |
| 1.10 | Slack 봇 텍스트 멘션 응답 | DONE | onNewMention → Gemini generateText → thread.post |
| 1.11 | Slack 봇 DM 응답 | DONE | onDirectMessage 핸들러 |
| 1.12 | Slack 봇 스레드 대화 유지 | DONE | thread.subscribe() + onSubscribedMessage |
| 1.13 | 시스템 프롬프트 (대화 모드) | DONE | SYSTEM_PROMPT → generateReply()에서 사용 |
| 1.14 | Vercel 배포 | DONE | `zero-to-agent-hackathon.vercel.app` |
| 1.15 | Vercel env vars 설정 | DONE | 5개 변수 등록 |
| 1.16 | 랜딩 페이지 (/) | DONE | 멀티플랫폼 상태 표시 |
| 1.17 | 대시보드 기본 UI (/dashboard) | DONE | Task 목록 + Submission 표시 (5초 폴링) |

---

## Phase 2: Slack 이미지 플로우 (핵심 데모)

매장 Food Stock 시나리오 완성 — 이미지 수신/분석/생성/발송 + DB 연동

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Slack에서 이미지 수신 (attachments + fetchData) | DONE | onSubscribedMessage에서 mimeType 체크 + fetchData() |
| 2.2 | Before 이미지 → Supabase Storage 업로드 | DONE | uploadImage() → `submissions/` 경로 |
| 2.3 | Before 이미지 → Gemini 멀티모달 분석 | DONE | analyzeBeforeImage() — base64 + expected image 비교 |
| 2.4 | AI 가이드 텍스트 생성 → Slack 스레드에 응답 | DONE | thread.post(guide) |
| 2.5 | After 이미지 → Gemini 멀티모달 평가 | DONE | evaluateAfterImage() → score(0-100) + evaluation |
| 2.6 | 평가 결과 → DB 저장 (ai_score, ai_evaluation, status) | DONE | updateSubmission() |
| 2.7 | 평가 결과 → Slack 스레드에 점수/피드백 응답 | DONE | formatEvaluation() → thread.post() |
| **2.8** | **이미지를 Slack으로 발송 (thread.post with files)** | **TODO** | **Chat SDK files: [] 지원하지만 미사용. Expected image를 스레드에 보여줘야 함** |
| **2.9** | **Gemini 이미지 생성 (가이드 이미지)** | **TODO** | **텍스트 가이드만 있고, 시각적 가이드 이미지 생성 없음. Imagen API 또는 Gemini image gen 필요** |
| **2.10** | **getNextPendingTask() 스마트 Task 할당** | **TODO** | **현재 sort_order 첫 번째만 반환 — 이미 제출된 Task 필터링 없음. 같은 Task만 계속 할당됨** |
| **2.11** | **Task별 시스템 프롬프트 강화** | **TODO** | **analyzeBeforeImage/evaluateAfterImage에 system: 필드 미사용. 인라인 지시만 있음** |
| **2.12** | **이미지 mimeType 동적 처리** | **TODO** | **현재 image/jpeg 하드코딩. PNG/WebP 등 Slack 업로드 형식 대응 필요** |
| **2.13** | **Food Stock 데모 시나리오 seed data 보강** | **TODO** | **Expected images 없음. 데모용 사진 업로드 + 가이드 텍스트 구체화** |
| **2.14** | **에러 핸들링 (Gemini 실패, 업로드 실패)** | **TODO** | **현재 throw만 함. 사용자에게 친화적 에러 메시지 필요** |

---

## Phase 3: Admin Dashboard 고도화

매니저가 실제 운영할 수 있는 대시보드

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Task 목록 표시 | DONE | /dashboard에 카드 UI |
| 3.2 | Submission 목록 (Expected/Before/After 이미지 비교) | DONE | 3열 이미지 비교 UI |
| 3.3 | AI 평가 점수 + 피드백 표시 | DONE | ScoreBadge + AI Evaluation 블록 |
| 3.4 | OK/Fail 버튼 (status=reviewed일 때) | DONE | /api/submissions/[id]/review 호출 |
| 3.5 | Ready to Payout 배너 | DONE | 모든 submission ok일 때 표시 |
| **3.6** | **Staff-AI 채팅 히스토리 표시** | **TODO** | **Slack 스레드 내용을 DB에 저장하지 않음. 대시보드에서 대화 타임라인 보기 필요** |
| **3.7** | **Task 생성 폼 (대시보드에서 직접)** | **TODO** | **POST /api/tasks 존재하지만 UI 폼 없음. 이미지 업로드 + 가이드 입력 필요** |
| **3.8** | **Task List 생성/관리 UI** | **TODO** | **POST /api/task-lists 존재하지만 UI 없음** |
| **3.9** | **Payout 액션 (승인 → 지급 트리거)** | **TODO** | **Ready to Payout 표시만 있고, 실제 액션(메시지 발송/상태 변경) 없음** |
| **3.10** | **실시간 업데이트 (Supabase Realtime 또는 SSE)** | **TODO** | **현재 5초 폴링. 실시간 반영이면 데모 임팩트 높음** |
| **3.11** | **대시보드 인증 (Manager vs Staff 구분)** | **TODO** | **현재 누구나 접근 가능. 해커톤 데모에서는 불필요할 수 있음** |

---

## Phase 4: Multi-Platform (Telegram + WhatsApp)

Chat SDK 멀티플랫폼 — "코드 한 줄 안 바꾸고 3개 플랫폼"

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Telegram 어댑터 설치 | DONE | `@chat-adapter/telegram` installed |
| 4.2 | WhatsApp 어댑터 설치 | DONE | `@chat-adapter/whatsapp` installed |
| 4.3 | Webhook 엔드포인트 (telegram, whatsapp) | DONE | `/api/webhooks/telegram`, `/api/webhooks/whatsapp` 응답 확인 |
| 4.4 | bot.ts 멀티어댑터 초기화 | DONE | createAdapters()에서 env 기반 조건부 등록 |
| **4.5** | **Telegram Bot Token 발급 + 설정** | **TODO** | **BotFather에서 토큰 발급 → env 추가 → webhook 등록** |
| **4.6** | **WhatsApp Business API 설정** | **TODO** | **Meta Developer에서 앱 생성 → Access Token → webhook 등록** |
| **4.7** | **Telegram 이미지 수신/발송 테스트** | **TODO** | **Chat SDK Telegram adapter의 file 지원 확인 필요** |
| **4.8** | **WhatsApp 이미지 수신/발송 테스트** | **TODO** | **24시간 메시징 윈도우 제한 주의** |
| **4.9** | **플랫폼별 UX 차이 대응** | **TODO** | **WhatsApp: 스레드 없음(flat), 버튼 3개 제한. Telegram: reply 기반** |

---

## Known Bugs

| Bug | File | Line | Severity |
|-----|------|------|----------|
| getNextPendingTask() 항상 같은 Task 반환 | `src/lib/bot.ts` | 53-61 | **HIGH** — 데모 깨짐 |
| mimeType `image/jpeg` 하드코딩 | `src/lib/gemini.ts` | 38, 87 | MEDIUM — PNG 업로드 시 문제 가능 |
| 이미지 발송 미구현 | `src/lib/bot.ts` | 전체 | **HIGH** — 시나리오 핵심 누락 |

---

## Summary

```
Phase 1 (Foundation):     17/17 DONE  ████████████████ 100%
Phase 2 (Image Flow):      7/14 DONE  ████████░░░░░░░░  50%
Phase 3 (Dashboard):       5/11 DONE  ████████░░░░░░░░  45%
Phase 4 (Multi-Platform):  4/9  DONE  ███████░░░░░░░░░  44%
```

**Next Priority: Phase 2 완성** — 이미지 발송, Task 할당 로직 수정, 데모 시나리오 보강
