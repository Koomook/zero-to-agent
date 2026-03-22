# Dashboard Integration Plan

> main 브랜치 mockup UI를 dev 브랜치 실제 백엔드와 통합하는 상세 계획서
> 작성일: 2026-03-21 | 리뷰 반영: 2026-03-21

## 0. 핵심 설계 결정

### task_list의 역할: 대시보드 분류 전용 (운영 경계 아님)

**결정:** `task_list`는 대시보드에서 태스크를 그룹핑하여 보여주는 **뷰 필터**일 뿐, 봇 할당이나 cron 발송의 운영 경계가 아니다.

**이유:**
- 현재 봇(`bot.ts:getNextPendingTask`)과 cron(`check-tasks/route.ts`)은 전체 tasks를 전역으로 훑음
- 봇을 task_list-aware로 만들려면 Slack 채널↔task_list 매핑이 필요하고, 이는 해커톤 스코프를 초과
- 실제 데모 시나리오에서 task_list는 1개

**결과:**
- 봇/cron 코드: **변경 없음** — 전역 할당 유지
- 대시보드 API: task_list_id로 **필터링하여 표시**만 함
- "Send Check Now" 같은 대시보드 액션은 해당 task_list의 tasks만 대상으로 동작 (대시보드→API 호출 시 task_list_id 필터)
- Payout도 대시보드 상에서 task_list 단위로 보여주지만, 실제 DB 업데이트는 해당 task_ids 기준

> **향후 확장:** 봇을 task_list-aware로 만들 경우, `getNextPendingTask(threadId, taskListId?)` 파라미터 추가 + Slack 채널별 task_list 매핑 테이블 필요. 현재 스코프에서는 하지 않음.

---

## 1. 현황 분석

### 1.1 두 브랜치의 차이

| 항목 | `origin/main` (mockup) | `dev` (실제 백엔드) |
|------|----------------------|-------------------|
| 데이터 | 하드코딩 mock 배열 | Supabase PostgreSQL |
| AI | 없음 | Gemini 2.5 Flash (before/after 이미지 분석) |
| 봇 | 없음 | Chat SDK (Slack/Telegram/WhatsApp) |
| 대시보드 | 4탭 (Tasks/Staff/Evaluations/Agent) | 단일 페이지 (폴링 기반 리뷰 보드) |
| 라우팅 | `/dashboard/[id]/{tab}` | `/dashboard` (flat) |
| 타입 | reward, achievements 포함 | DB 스키마 1:1 매핑 |
| i18n | en/ja/ko 3개 국어 | 없음 |
| 앱 이름 | EvalFlow | Shelf Coach |

### 1.2 통합 스코프

**포함:**
- Tasks 탭 (태스크 목록 + 상세 모달 + CSV 업로드)
- Evaluations 탭 (제출물 리뷰 + 이미지 비교 — 3-column: Expected/Before/After)
- Sidebar (Tasks/Evaluations 네비게이션 + task_list 스위칭)
- Reward 프로세스 (태스크 완료 시 보상 확정 → 일괄 지급)

**제외:**
- Staff 탭, Agent Monitor 탭, Settings 탭
- i18n (영어 단일)
- main의 `achievements[]` 개념 (dev의 submission 플로우로 대체)
- 채팅 로그 UI (봇 대화는 Slack에만 존재, 대시보드에서는 이미지 비교로 대체)

---

## 2. 스키마 확장 (Phase A)

> 원칙: dev 스키마가 기준. main의 mock 타입에서 reward 관련만 선택적 도입.

### 2.1 `tasks` 테이블 — 컬럼 추가

```sql
ALTER TABLE tasks
  ADD COLUMN description text,            -- main의 task description (text_guide와 별도: 사람용 설명)
  ADD COLUMN reward_amount numeric DEFAULT 0;  -- 태스크 완료 시 보상 금액
```

| 컬럼 | 타입 | 용도 | 출처 |
|------|------|------|------|
| `description` | text | Manager가 보는 태스크 설명 (text_guide는 AI 가이드용) | main의 `Task.description` |
| `reward_amount` | numeric | 태스크별 보상 금액 | main의 `Task.rewardAmount` |

### 2.2 `task_submissions` 테이블 — 컬럼 추가

```sql
ALTER TABLE task_submissions
  ADD COLUMN reward_amount numeric,        -- 확정된 보상 금액 (null = 미확정)
  ADD COLUMN reward_note text,             -- 보상 메모
  ADD COLUMN paid_at timestamptz;          -- 지급 완료 시점 (null = 미지급)
```

| 컬럼 | 타입 | 용도 |
|------|------|------|
| `reward_amount` | numeric | OK 시 확정되는 금액 (tasks.reward_amount에서 복사) |
| `reward_note` | text | Manager 메모 |
| `paid_at` | timestamptz | 지급 완료 시 타임스탬프 |

### 2.3 `ai_guide_image_url` 정합성 수정

현재 `types.ts`에 `ai_guide_image_url` 필드가 있지만 `schema.sql`에 없음.

```sql
ALTER TABLE task_submissions
  ADD COLUMN ai_guide_image_url text;      -- AI가 생성한 가이드 이미지 URL
```

### 2.4 Migration SQL (단일 파일)

```sql
-- Migration: dashboard-integration
-- Description: Add reward columns + description + ai_guide_image_url

-- tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reward_amount numeric DEFAULT 0;

-- task_submissions
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS reward_amount numeric;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS reward_note text;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS ai_guide_image_url text;
```

### 2.5 타입 업데이트 (`src/lib/types.ts`)

```ts
// 기존 유지 + 확장
export type Task = {
  id: string;
  task_list_id: string;
  title: string;
  description: string | null;         // NEW
  text_guide: string | null;
  expected_image_url: string | null;
  reward_amount: number;               // NEW
  sort_order: number;
  created_at: string;
};

export type TaskSubmission = {
  id: string;
  task_id: string;
  staff_name: string | null;
  platform: string;
  thread_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
  ai_guide: string | null;
  ai_guide_image_url: string | null;
  ai_score: number | null;
  ai_evaluation: string | null;
  status: "pending" | "reviewed" | "ok" | "fail";
  reward_amount: number | null;        // NEW
  reward_note: string | null;          // NEW
  paid_at: string | null;             // NEW
  created_at: string;
  reviewed_at: string | null;
};
```

---

## 3. API 변경 (Phase B)

### 3.1 기존 API 수정

#### `GET /api/tasks` — task_list_id 필터 추가

```
GET /api/tasks?task_list_id={uuid}
```

```ts
// src/app/api/tasks/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskListId = searchParams.get("task_list_id");

  let query = getSupabase()
    .from("tasks")
    .select("*, task_list:task_lists(name)")
    .order("sort_order", { ascending: true });

  if (taskListId) {
    query = query.eq("task_list_id", taskListId);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

#### `GET /api/submissions` — task_list_id 필터 추가

```
GET /api/submissions?task_list_id={uuid}
```

**주의:** PostgREST에서 `.eq("task.task_list_id", ...)` 방식은 outer join 기본 동작 때문에
부모 row가 필터되지 않을 수 있음. `!inner` join을 사용해야 관계 필터가 부모에 전파됨.

```ts
// src/app/api/submissions/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskListId = searchParams.get("task_list_id");

  // task_list_id 필터가 있으면 !inner join으로 부모 필터 전파
  const taskJoin = taskListId
    ? "task:tasks!inner(id, title, text_guide, expected_image_url, task_list_id)"
    : "task:tasks(id, title, text_guide, expected_image_url, task_list_id)";

  let query = getSupabase()
    .from("task_submissions")
    .select(`*, ${taskJoin}`)
    .order("created_at", { ascending: false });

  if (taskListId) {
    query = query.eq("task.task_list_id", taskListId);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

> `!inner`를 쓰면 해당 task_list_id에 속하지 않는 task의 submission은 결과에서 제외됨.

#### `POST /api/tasks` — description, reward_amount 지원

```ts
const { task_list_id, title, description, text_guide, expected_image_url, reward_amount, sort_order } = body;
```

### 3.2 신규 API

#### `PUT /api/tasks/[id]` — 태스크 수정

```
PUT /api/tasks/{id}
Body: { title?, description?, text_guide?, expected_image_url?, reward_amount?, sort_order? }
```

```ts
// src/app/api/tasks/[id]/route.ts
export async function PUT(request: Request, context: RouteContext<"/api/tasks/[id]">) {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await getSupabase()
    .from("tasks")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

#### `DELETE /api/tasks/[id]` — 태스크 삭제

```ts
export async function DELETE(request: Request, context: RouteContext<"/api/tasks/[id]">) {
  const { id } = await context.params;

  const { error } = await getSupabase()
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
```

#### `POST /api/submissions/[id]/reward` — 보상 확정

```
POST /api/submissions/{id}/reward
Body: { reward_amount: number, reward_note?: string }
```

```ts
// src/app/api/submissions/[id]/reward/route.ts
export async function POST(request: Request, context: RouteContext<"/api/submissions/[id]/reward">) {
  const { id } = await context.params;
  const { reward_amount, reward_note } = await request.json();

  const { data, error } = await getSupabase()
    .from("task_submissions")
    .update({ reward_amount, reward_note })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

### 3.4 Review Route 상세 — reward 자동 복사 (§3.4)

현재 review route는 `status`와 `reviewed_at`만 갱신. OK 시 해당 task의 `reward_amount`를
submission에 자동 복사하는 로직을 추가해야 함.

```ts
// src/app/api/submissions/[id]/review/route.ts — 수정 후 전체
export async function POST(
  request: Request,
  context: RouteContext<"/api/submissions/[id]/review">,
) {
  const { id } = await context.params;
  const { status } = (await request.json()) as { status: "ok" | "fail" };

  if (!["ok", "fail"].includes(status)) {
    return Response.json({ error: 'status must be "ok" or "fail"' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
  };

  // OK인 경우: task의 reward_amount를 submission에 복사
  if (status === "ok") {
    // 1. 이 submission의 task_id로 task 조회
    const { data: submission } = await getSupabase()
      .from("task_submissions")
      .select("task_id")
      .eq("id", id)
      .single();

    if (submission) {
      const { data: task } = await getSupabase()
        .from("tasks")
        .select("reward_amount")
        .eq("id", submission.task_id)
        .single();

      // task에 reward_amount가 설정되어 있으면 submission에 복사
      if (task?.reward_amount) {
        updatePayload.reward_amount = task.reward_amount;
      }
    }
  }

  const { data, error } = await getSupabase()
    .from("task_submissions")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

**플로우:**
1. Manager가 OK 클릭 → `POST /api/submissions/{id}/review { status: "ok" }`
2. API가 해당 submission의 `task_id`로 task 조회
3. `task.reward_amount`가 있으면 → `submission.reward_amount`에 복사
4. Manager가 금액 조정하고 싶으면 → 별도로 `POST /api/submissions/{id}/reward` 호출

---

#### `POST /api/task-lists/[id]/payout` — 일괄 지급 확정

```
POST /api/task-lists/{id}/payout
```

**전제 조건 (가드):**
- `status = "ok"` AND `reward_amount IS NOT NULL` AND `paid_at IS NULL`
- reward_amount가 null인 submission은 지급 대상에서 **제외** (reward 미확정)

```ts
// src/app/api/task-lists/[id]/payout/route.ts
export async function POST(request: Request, context: RouteContext<"/api/task-lists/[id]/payout">) {
  const { id } = await context.params;

  // 1. task_list에 속한 task ids 조회
  const { data: tasks } = await getSupabase()
    .from("tasks")
    .select("id")
    .eq("task_list_id", id);

  const taskIds = tasks?.map(t => t.id) ?? [];
  if (taskIds.length === 0) {
    return Response.json({ error: "No tasks in this list" }, { status: 404 });
  }

  // 2. 지급 가능 여부 사전 체크: ok이지만 reward 미확정인 submission이 있는지
  const { data: unconfirmed } = await getSupabase()
    .from("task_submissions")
    .select("id")
    .in("task_id", taskIds)
    .eq("status", "ok")
    .is("reward_amount", null);

  if (unconfirmed && unconfirmed.length > 0) {
    return Response.json({
      error: `${unconfirmed.length} submission(s) approved but reward not confirmed`,
      unconfirmed_ids: unconfirmed.map(s => s.id),
    }, { status: 400 });
  }

  // 3. 가드 통과 — ok + reward 확정 + 미지급인 것만 지급 처리
  const { data, error } = await getSupabase()
    .from("task_submissions")
    .update({ paid_at: new Date().toISOString() })
    .in("task_id", taskIds)
    .eq("status", "ok")
    .not("reward_amount", "is", null)
    .is("paid_at", null)
    .select();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const totalAmount = data?.reduce((sum, s) => sum + (s.reward_amount ?? 0), 0) ?? 0;
  return Response.json({ paid_count: data?.length ?? 0, total_amount: totalAmount });
}
```

**불변조건:** `paid_at`이 설정된 row는 반드시 `status = "ok"` AND `reward_amount IS NOT NULL`.

### 3.3 API 요약

| 엔드포인트 | Method | 상태 | 변경 내용 |
|-----------|--------|------|----------|
| `/api/task-lists` | GET, POST | 기존 유지 | - |
| `/api/tasks` | GET | 수정 | `task_list_id` 쿼리 파라미터 필터 |
| `/api/tasks` | POST | 수정 | `description`, `reward_amount` 필드 추가 |
| `/api/tasks/[id]` | PUT, DELETE | **신규** | 태스크 수정/삭제 |
| `/api/submissions` | GET | 수정 | `task_list_id` 필터 (join 경유) |
| `/api/submissions/[id]/review` | POST | **수정** | OK 시 reward 자동 복사 (상세: §3.4) |
| `/api/submissions/[id]/reward` | POST | **신규** | 개별 보상 금액 확정 |
| `/api/task-lists/[id]/payout` | POST | **신규** | 일괄 지급 확정 |

---

## 4. 라우팅 구조 변경 (Phase C)

### 4.1 새 라우팅 트리

```
src/app/
├── layout.tsx                              ← 기존 유지 (root)
├── page.tsx                                ← 리다이렉트: /dashboard 로
├── dashboard/
│   ├── layout.tsx                          ← NEW: Sidebar + <main> wrapper
│   ├── page.tsx                            ← 수정: task_list 선택 페이지 (또는 첫번째 리스트로 리다이렉트)
│   └── [id]/
│       ├── page.tsx                        ← NEW: task_list 개요 (태스크 수, 진행률, 총 보상)
│       ├── tasks/
│       │   └── page.tsx                    ← NEW: 태스크 목록 + 상세 모달
│       └── evaluations/
│           └── page.tsx                    ← NEW: 제출물 리뷰 보드
```

### 4.2 기존 `/dashboard/page.tsx` 처리

현재 dev의 단일 대시보드를 `/dashboard/[id]/evaluations/page.tsx`로 이전.
기존 `/dashboard/page.tsx`는 task_list 목록 표시 또는 첫 번째 리스트로 리다이렉트.

### 4.3 `[id]` 파라미터

`[id]` = `task_lists.id` (UUID). main의 환경 스위칭 (`store-a`, `store-b`)을 실제 task_list로 대체.

---

## 5. UI 이식 상세 (Phase D)

### 5.1 Sidebar (`src/components/sidebar.tsx`)

**main에서 가져올 것:**
- 레이아웃 구조 (w-60, flex-col, border-right)
- 스타일링 (zinc 색상 체계, dark mode)

**수정할 것:**
- 환경 드롭다운 → `GET /api/task-lists`로 실제 task_list 목록 fetch
- 네비게이션: `tasks`, `evaluations` 2개만 (staff, agent, settings 제거)
- i18n 제거 — 영어 하드코딩
- 하단 locale selector 제거

**구현 스펙:**

```tsx
// 의사코드
const Sidebar = () => {
  const [taskLists, setTaskLists] = useState([]);        // GET /api/task-lists
  const [currentId, setCurrentId] = useState(params.id); // URL에서

  return (
    <aside className="w-60 border-r ...">
      {/* Task List 선택 드롭다운 */}
      <select onChange={navigate to /dashboard/{id}/tasks}>
        {taskLists.map(tl => <option key={tl.id}>{tl.name}</option>)}
      </select>

      {/* 네비게이션 */}
      <nav>
        <Link href={`/dashboard/${currentId}/tasks`}>Tasks</Link>
        <Link href={`/dashboard/${currentId}/evaluations`}>Evaluations</Link>
      </nav>
    </aside>
  );
};
```

### 5.2 Tasks 페이지 (`/dashboard/[id]/tasks/page.tsx`)

**main에서 가져올 것:**
- 태스크 리스트 UI (priority badge, evaluator badge, reward 표시)
- CSV 업로드 기능 (`parseCSV` 함수)
- `TaskDetailModal` 컴포넌트

**Mock → 실제 API 교체:**

| main (mock) | dev (실제) |
|------------|-----------|
| `const initialTasks: Task[] = [...]` | `fetch("/api/tasks?task_list_id=${id}")` |
| `const staffList: Staff[] = [...]` | 제거 (dev에서 staff는 봇이 자동 할당) |
| `setTasks(prev => prev.map(...))` (로컬 상태) | `PUT /api/tasks/${taskId}` + refetch |
| `parseCSV()` → 로컬 추가 | `parseCSV()` → `POST /api/tasks` 반복 호출 |

**타입 매핑:**

| main의 `Task` 필드 | dev 대응 | 처리 |
|-------------------|---------|------|
| `id` | `id` (uuid) | 그대로 |
| `title` | `title` | 그대로 |
| `description` | `description` (NEW) | 스키마 추가 |
| `assigneeId` | 없음 (봇이 자동 할당) | UI에서 제거 |
| `status` | 없음 (submission 기반) | 계산: submission 있으면 in_progress, 없으면 pending |
| `priority` | 없음 | 스코프 아웃 (추후 추가 가능) |
| `dueDate` | 없음 | 스코프 아웃 |
| `evaluator` | 없음 (항상 AI + human 2단계) | 제거 |
| `rewardHours` | 없음 | 제거 |
| `rewardAmount` | `reward_amount` (NEW) | 스키마 추가 |
| `achievements[]` | 없음 (submission이 대체) | 제거 — 대신 submission 수/상태로 진행률 표시 |

**TaskDetailModal 수정:**
- achievements 체크리스트 → submission 히스토리 뷰로 교체
- reward hours 제거, reward_amount만 유지
- assignee 선택 제거
- priority/dueDate/evaluator: 제거 또는 읽기 전용
- Save 버튼 → `PUT /api/tasks/${id}` 호출

### 5.3 Evaluations 페이지 (`/dashboard/[id]/evaluations/page.tsx`)

**main에서 가져올 것:**
- 2-패널 레이아웃 (왼쪽: 테이블, 오른쪽: 상세)
- Status badge 색상 체계

**가져오지 않는 것:**
- 채팅 로그 UI (말풍선) — 봇 대화는 Slack에만 존재하며 DB에 저장하지 않음. 이미지 비교(3-column)로 대체
- conversationRating, agentHistoryRating — 제거

**Mock → 실제 API 교체:**

| main (mock) | dev (실제) |
|------------|-----------|
| `initialEvaluations[]` | `fetch("/api/submissions?task_list_id=${id}")` (§3.1 `!inner` join) |
| 6가지 status | 4가지: `pending`, `reviewed`, `ok`, `fail` |
| `chatLog: ChatMessage[]` | 제거 — 3-column 이미지 비교로 대체 |
| conversationRating, agentHistoryRating | 제거 |

**Status 매핑:**

| main status | dev 대응 | 의미 |
|------------|---------|------|
| `pending` | `pending` | Staff가 아직 이미지 미제출 |
| `agent_auto` | `reviewed` | AI가 평가 완료 (score + evaluation 있음) |
| `approved` | `ok` | Manager가 승인 |
| `rejected` | `fail` | Manager가 반려 |
| `agent_approved` | 해당 없음 | 제거 |
| `agent_rejected` | 해당 없음 | 제거 |

**Evaluations 페이지 구조:**

```
┌─────────────────────────────────┬──────────────────────────┐
│  Submission 테이블               │  상세 패널 (w-96)          │
│                                 │                          │
│  Staff | Task | Score | Status  │  3-Column Image Compare  │
│  ───── + ──── + ───── + ──────  │  Expected | Before | After│
│  Alice | 선반정리 | 85  | reviewed│                          │
│  Bob   | 테이블  | -   | pending │  AI Guide                │
│                                 │  AI Evaluation           │
│                                 │  Score: 85/100           │
│                                 │                          │
│                                 │  [OK] [Fail] ← reviewed만│
│                                 │                          │
│                                 │  Reward: $120            │
│                                 │  [Confirm Reward]        │
└─────────────────────────────────┴──────────────────────────┘
```

**Reward 플로우 (Evaluations 내):**
1. Submission이 `ok` 상태가 되면 reward 섹션 표시
2. 기본값: `tasks.reward_amount` (태스크에 설정된 금액)
3. Manager가 금액 수정 가능 → `POST /api/submissions/${id}/reward`
4. 모든 submission이 `ok` + reward 확정되면 → "Payout" 버튼 활성화
5. Payout 클릭 → `POST /api/task-lists/${id}/payout`

### 5.4 Dashboard Layout (`/dashboard/layout.tsx`)

```tsx
// main 구조 그대로
<div className="flex flex-1">
  <Sidebar />
  <main className="flex-1">{children}</main>
</div>
```

### 5.5 Dashboard Home (`/dashboard/[id]/page.tsx`)

간단한 개요 페이지:
- task_list 이름
- 태스크 수 / 완료된 submission 수 / 총 보상 금액
- 진행률 바
- "All Done → Payout" CTA

---

## 6. 파일 변경 목록

### 신규 생성

| 파일 | 설명 |
|------|------|
| `src/app/dashboard/layout.tsx` | Sidebar + main wrapper |
| `src/app/dashboard/[id]/page.tsx` | Task list 개요 |
| `src/app/dashboard/[id]/tasks/page.tsx` | 태스크 목록 (main에서 이식) |
| `src/app/dashboard/[id]/evaluations/page.tsx` | 제출물 리뷰 (main + dev 합성) |
| `src/components/sidebar.tsx` | 네비게이션 (main에서 이식, 축소) |
| `src/components/task-detail-modal.tsx` | 태스크 상세 모달 (main에서 이식, 수정) |
| `src/app/api/tasks/[id]/route.ts` | PUT, DELETE |
| `src/app/api/submissions/[id]/reward/route.ts` | 보상 확정 |
| `src/app/api/task-lists/[id]/payout/route.ts` | 일괄 지급 |
| `supabase/migrations/002_dashboard_integration.sql` | 스키마 확장 |

### 수정

| 파일 | 변경 |
|------|------|
| `src/lib/types.ts` | Task, TaskSubmission 타입에 reward 필드 추가 |
| `src/app/api/tasks/route.ts` | GET에 task_list_id 필터, POST에 새 필드 |
| `src/app/api/submissions/route.ts` | GET에 task_list_id 필터 |
| `src/app/api/submissions/[id]/review/route.ts` | OK 시 reward_amount 자동 복사 로직 |
| `src/app/dashboard/page.tsx` | task_list 목록 표시 또는 리다이렉트로 변경 |
| `supabase/schema.sql` | 새 컬럼 반영 (canonical 스키마) |

### 삭제 없음

기존 파일은 삭제하지 않음. `/dashboard/page.tsx`는 역할 변경만.

---

## 7. 실행 순서

```
Step 1: 스키마 확장
├── supabase migration 실행
├── types.ts 업데이트
└── schema.sql 원본 업데이트

Step 2: API 수정/추가
├── tasks route — 필터 + 새 필드
├── submissions route — 필터
├── tasks/[id] route — PUT, DELETE (신규)
├── submissions/[id]/review — reward 자동 복사
├── submissions/[id]/reward — 신규
└── task-lists/[id]/payout — 신규

Step 3: 라우팅 + 레이아웃
├── dashboard/layout.tsx (신규)
├── dashboard/page.tsx (수정: task_list selector)
└── dashboard/[id]/page.tsx (신규: 개요)

Step 4: UI 이식 — Tasks
├── sidebar.tsx (main에서 이식 + 축소)
├── tasks/page.tsx (main에서 이식 + API 연결)
└── task-detail-modal.tsx (main에서 이식 + 수정)

Step 5: UI 이식 — Evaluations
├── evaluations/page.tsx (main UI + dev 데이터 합성)
├── 이미지 비교 3-column (dev 기존 로직 활용)
└── reward 확정 + payout 플로우

Step 6: 검증
├── pnpm build — 빌드 성공 확인
├── 로컬 E2E — task 생성 → 봇으로 submission → 대시보드 리뷰 → payout
└── Vercel deploy
```

---

## 8. main 브랜치에서 가져오지 않는 것 (명시적 제외)

| 항목 | 이유 |
|------|------|
| `i18n/` 전체 (3개 언어 파일 + provider) | 해커톤 스코프 → 영어 단일 |
| `achievements[]` 시스템 | dev의 submission 플로우가 대체 |
| `Staff` 타입 + staff 할당 UI | 봇이 자동 할당, staff_name은 Slack username |
| `evaluator` 필드 (human vs agent_auto) | 항상 AI 1차 + Manager 2차 고정 |
| `rewardHours` | 시간 기반 보상 불필요, 금액만 |
| `agent/page.tsx` | 스코프 아웃 |
| `staff/page.tsx` | 스코프 아웃 |
| `priority` 필드 | 추후 추가 가능하나 현재 불필요 |
| `dueDate` 필드 | 동일 |

---

## 9. Reward 플로우 상세

```
Manager가 Task 생성 시 reward_amount 설정 (예: $120)
           │
           ▼
Staff가 봇에서 이미지 제출 → AI 평가 (score + evaluation)
           │
           ▼
submission.status = "reviewed" (AI 완료)
           │
           ▼
Manager가 대시보드에서 OK 클릭
  → submission.status = "ok"
  → submission.reward_amount = task.reward_amount (자동 복사)
           │
           ▼
Manager가 reward 금액 조정 가능 (선택적)
  → POST /api/submissions/{id}/reward
           │
           ▼
모든 submission이 ok + reward 확정
  → "Ready to Payout" 배너
           │
           ▼
Payout 클릭
  → POST /api/task-lists/{id}/payout
  → 모든 ok submission에 paid_at 설정
  → 총 지급 금액 표시
```

---

## 10. 리스크 & 주의사항

| 리스크 | 대응 |
|--------|------|
| main의 `next/image` + `placehold.co` 사용 | dev에서는 Supabase Storage URL 사용, `next.config.ts`에 remotePatterns 설정 필요 |
| Supabase join 필터 (`task.task_list_id`) 복잡성 | `!inner` join 사용으로 해결 (§3.1 참조) |
| CSV 업로드 시 대량 INSERT | 트랜잭션 또는 batch insert API 고려 |
| main의 Tailwind v4 CSS vars | dev도 동일 Tailwind v4 → 호환 문제 없음 |
| `RouteContext` 타입 | Next.js 16 빌트인인지 확인 필요 (현재 dev에서 이미 사용 중이므로 OK) |
