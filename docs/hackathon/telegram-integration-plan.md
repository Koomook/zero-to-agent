# Telegram Integration Plan — Shelf Coach

> Chat SDK 핵심 정신: **Write once, deploy everywhere**
> 어댑터 추상화 덕분에 핸들러 코드는 공유된다. 단, 인프라 계층에 검증되지 않은 가정이 있다.

## 인프라 설정 상태

| 항목 | 상태 |
|------|------|
| `@chat-adapter/telegram` 설치 | Done |
| `bot.ts` — adapter 조건 분기 | Done (`TELEGRAM_BOT_TOKEN` 감지 시 자동 등록) |
| `env.ts` — 플랫폼 env 정의 | Done |
| Webhook route `/api/webhooks/telegram` | Done (동적 `[platform]` 라우트) |
| Vercel env vars | Done (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`) |
| Telegram webhook 등록 | Done (`setWebhook` API 호출 완료) |
| **봇 username** | `@kani_hackathon_bot` |

---

## Assumptions (검증 전)

현재 코드가 Telegram에서 동작한다는 판단은 아래 가정에 의존한다. **모두 미검증.**

### A1. `createMemoryState()`가 Vercel 서버리스에서 subscription을 유지한다 — FALSE

`bot.ts:195`에서 `createMemoryState()`를 사용한다. Chat SDK 문서(`state.mdx:15`):

> "When your bot calls `thread.subscribe()`, the state adapter persists that subscription. ... With a production adapter, subscriptions survive restarts and work across multiple instances."

`createMemoryState()`는 **인메모리/dev-only**. Vercel 서버리스에서:
- 콜드 스타트마다 subscription 소실
- 여러 인스턴스 간 subscription 공유 불가
- `onSubscribedMessage` 핸들러가 간헐적으로 트리거되지 않음

**이 문제는 Telegram 고유가 아니라 Slack에서도 동일.** 현재 Slack이 동작하는 이유는 핫 인스턴스에서 메모리가 유지되는 행운에 의존한다.

**해결**: `@chat-adapter/state-pg` (Supabase PostgreSQL 활용) 또는 `@chat-adapter/state-redis`로 교체.

### A2. Telegram DM에서 `onDirectMessage`와 `onNewMention`이 이중 발화하지 않는다

Chat SDK 문서(`direct-messages.mdx`): DM 메시지는 `isMention=true`로 설정됨.
`bot.ts`는 `onNewMention`(198행)과 `onDirectMessage`(222행) **둘 다 등록**.

만약 두 핸들러가 동시에 발화하면:
- `createSubmission()` 2회 호출 → 중복 submission
- `thread.post()` 2회 → 사용자에게 중복 응답

**검증 방법**: Telegram DM 전송 후 Vercel 로그에서 핸들러 진입 로그 확인.

### A3. Telegram DM의 `thread.id`가 `onDirectMessage` → `onSubscribedMessage` 간 일관된다

`bot.ts:67-72`에서 `thread.id`로 submission을 조회한다.
Slack은 스레드 ID가 안정적이지만, Telegram은 chat ID 기반으로 다를 수 있다.

불일치 시 Before 이미지 전송 후 submission 조회 실패 → 이미지 플로우 전체가 깨진다.

### A4. Telegram 앨범(media group)이 `message.attachments`로 정상 파싱된다

사용자가 사진 여러 장을 동시에 보내면 Telegram은 앨범으로 묶는다.
`getFirstImageAttachment()`가 첫 장만 처리하므로 단일 이미지는 OK이나,
앨범이 **다수 메시지로 분리**되면 각각이 `onSubscribedMessage`를 트리거해 예기치 않은 동작 발생 가능.

---

## Gaps (코드와 문서 사이 불일치)

### G1. 검증 체크리스트와 실제 코드 불일치

이전 문서의 Phase 2 체크리스트:
> "할 일 알려줘" → Task 목록 응답 → Task 번호로 할당

**실제 코드(`bot.ts:206`, `bot.ts:230`)**: `getNextPendingTask()`로 다음 미완료 Task를 **자동 할당**한다. Task 목록 표시나 번호 선택 UX는 존재하지 않는다.

### G2. `build-status.md`와의 상태 불일치

`build-status.md:111`에서 Phase 4.5 "Telegram Bot Token 발급 + 설정"은 **TODO**.
이 문서에서는 **Done**으로 표기.

→ `build-status.md` 동기 업데이트 필요.

### G3. 로컬 테스트 불가

Telegram webhook은 HTTPS 필수. `pnpm dev` (localhost)로는 webhook 수신 불가.
→ 모든 검증은 Vercel deploy 환경에서 수행해야 한다.

---

## Telegram 프로액티브 메시지 스펙

Cron/대시보드에서 Task를 자동 발송할 때 Telegram은 Slack과 다르게 동작해야 한다.

### Slack (현재 구현: `/api/cron/check-tasks`)

- 채널에 **모든 Task**를 한번에 발송 (Task마다 별도 스레드 생성)
- Staff가 해당 스레드에 이미지를 올리면 `onSubscribedMessage`로 처리
- 채널 기반이므로 여러 Task를 동시에 노출해도 자연스러움

### Telegram (스펙 — 미구현)

- DM으로 **1개 Task만** 발송
- 이유:
  - Telegram DM은 스레드 개념이 없음 (flat conversation)
  - 여러 Task를 동시에 보내면 어떤 이미지가 어떤 Task의 Before/After인지 구분 불가
  - 1개 Task → Before 이미지 → 가이드 → After 이미지 → 평가 → **완료 후 다음 Task** 순차 진행
- 발송 대상: `TELEGRAM_CHAT_ID` (특정 유저 또는 그룹) 또는 `bot.openDM()` (미검증, A5)
- Task 선택 로직: `getNextPendingTask()`와 동일 — 미완료 Task 중 sort_order 기준 첫 번째

### 구현 시 고려사항

| 항목 | Slack | Telegram |
|------|-------|----------|
| 발송 단위 | 전체 Task 일괄 | 1개 Task |
| 대화 컨텍스트 | 스레드 (격리됨) | DM (flat, 섞임) |
| Task↔이미지 매핑 | thread_id로 자동 | 현재 active submission으로 매핑 |
| 완료 후 다음 Task | 독립 (각 스레드) | 순차 (이전 Task 완료 후 자동 할당) |

---

## Telegram vs Slack — 플랫폼 차이

### Chat SDK가 추상화하는 것 (코드 변경 불필요)

| 기능 | 작동 방식 |
|------|----------|
| `message.text` | 플랫폼 무관 텍스트 |
| `message.attachments` + `fetchData()` | 이미지 다운로드 통합 |
| `thread.post(text)` | 플랫폼별 전송 자동 |
| `thread.post({ files })` | 파일 전송 (Telegram: 1개/메시지 제한) |
| `thread.subscribe()` | 대화 추적 (state adapter 의존) |

### 현재 bot.ts가 사용하지 않아 영향 없는 것

Cards/Block Kit, Select menus, Modals, Slash commands, Ephemeral messages, Scheduled messages, `openDM()`, 메시지 히스토리 조회 — 모두 Telegram 미지원이나 현재 코드에서 사용하지 않음.

### Telegram에서 추가로 활용 가능한 것

| 기능 | 설명 |
|------|------|
| `thread.startTyping()` | Gemini 분석 중 타이핑 표시 (Slack은 미지원) |
| Forum topics | 슈퍼그룹에서 매장별 토픽 분리 |

---

## 검증 체크리스트 (실제 코드 기반)

> 모든 테스트는 Vercel deploy 환경에서 실행. 로컬 불가.

### Phase 1: 핸들러 동작 확인

- [ ] `@kani_hackathon_bot`에게 DM 전송 → 응답 수신 확인
- [ ] Vercel 로그: `onDirectMessage`만 트리거되는지, `onNewMention`도 동시에 트리거되는지 확인 (A2)
- [ ] 그룹에 봇 추가 → `@kani_hackathon_bot` 멘션 → 응답 확인
- [ ] 같은 대화에서 후속 메시지 전송 → `onSubscribedMessage` 트리거 확인 (A1 검증)
- [ ] 콜드 스타트 후 같은 대화에서 메시지 전송 → subscription 유지 여부 확인 (A1 검증)

### Phase 2: 이미지 플로우 (Task Mode)

전제: Supabase에 Task seed data 존재.

- [ ] DM 전송 → 자동으로 다음 미완료 Task 할당 + `formatTaskPrompt()` 응답
- [ ] Expected image 첨부 전송 확인
- [ ] Before 이미지 1장 전송 → Gemini 분석 + 가이드 텍스트 응답
- [ ] Supabase `task_submissions` 테이블에 `platform: "telegram"` 저장 확인
- [ ] `thread.id` 값이 첫 DM과 이미지 전송 시 동일한지 로그로 확인 (A3)
- [ ] After 이미지 전송 → Gemini 평가 + 점수 응답
- [ ] 여러 이미지 동시 전송(앨범) → 동작 확인 (A4)

### Phase 3: State adapter 교체 (A1 해결)

- [ ] `@chat-adapter/state-pg` 설치
- [ ] Supabase PostgreSQL 연결
- [ ] `createMemoryState()` → `createPostgresState()` 교체
- [ ] 콜드 스타트 후 subscription 유지 검증

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────┐
│                    Chat SDK                      │
│                                                  │
│  ┌──────────────┐       ┌──────────────┐         │
│  │  Slack        │       │  Telegram     │         │
│  │  Adapter      │       │  Adapter      │         │
│  └──────┬───────┘       └──────┬───────┘         │
│         │                      │                  │
│         └──────────┬───────────┘                  │
│                      ▼                            │
│            Normalized Thread/Message              │
│                      │                            │
│       ┌──────────────┼──────────────┐             │
│       ▼              ▼              ▼             │
│  onNewMention  onDirectMsg  onSubscribedMsg      │
│       │              │              │             │
│       └──────────────┼──────────────┘             │
│                      ▼                            │
│           Shelf Coach Business Logic              │
│     (Task 자동할당 → 이미지 분석 → 평가)           │
│                      │                            │
│            ┌─────────┼─────────┐                  │
│            ▼         ▼         ▼                  │
│         Gemini   Supabase   Dashboard             │
│                    ▲                              │
│                    │                              │
│         State Adapter (현재: Memory ⚠️)           │
│         → 프로덕션: PostgreSQL 필요               │
└─────────────────────────────────────────────────┘
```

---

## 요약

| 구분 | 상태 |
|------|------|
| 인프라 설정 (env, webhook) | Done |
| 어댑터 코드 | Done (변경 불필요) |
| **State adapter (subscription 지속성)** | **GAP — `createMemoryState()`는 서버리스에서 불안정 (Slack도 동일)** |
| **이중 핸들러 발화** | **미검증 (A2)** |
| **thread.id 일관성** | **미검증 (A3)** |
| **앨범 처리** | **미검증 (A4)** |
| build-status.md 동기화 | 필요 |

**"코드 변경 없이 동작"은 핸들러 계층에서만 참. State adapter 교체가 프로덕션 안정성의 전제 조건이며, 이는 Telegram 고유 문제가 아니라 전 플랫폼 공통 문제.**
