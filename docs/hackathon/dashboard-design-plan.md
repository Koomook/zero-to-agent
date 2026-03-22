# Dashboard Design Upgrade Plan

> main 브랜치 EvalFlow UI 패턴을 dev(Kani)에 적용하는 디자인 개선 계획
> 작성일: 2026-03-22

## Design Principles (from main)

- **Zinc-only neutrals** — 모든 neutral은 zinc 계열 통일
- **Consistent dark mode** — badge dark는 항상 `{color}-900/30` bg + `{color}-400` text
- **Button hierarchy** — primary(zinc-900/white invert), secondary(outlined), colored(emerald/red-600→700)
- **Spacing rhythm** — p-8 page, space-y-2 list, px-4 py-3 cells, px-1.5 py-0.5 badges
- **Border radius** — rounded-md(buttons/inputs), rounded-lg(cards/panels), rounded(badges)
- **Transitions** — `transition-colors` only, one-shade-darker hover

---

## Step 1: Top Navigation Bar

**현재**: nav 없이 바로 콘텐츠
**목표**: 고정 top bar (h-14) — 로고 + 앱명 + task list selector + actions

```
┌──────────────────────────────────────────────────────────┐
│ ◆ Kani          [Task List ▾]           [Send Check] [●] │
└──────────────────────────────────────────────────────────┘
```

**구현**:
- `src/app/dashboard/components/TopBar.tsx` 신규
- `h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950`
- 왼쪽: 로고(◆) + "Kani" (font-bold)
- 가운데: task list `<select>` (현재 page.tsx에 있는 것 이동)
- 오른쪽: "Send Check Now" 버튼 + Ready to Payout badge
- page.tsx에서 header 영역 제거, TopBar로 대체

**파일**: `src/app/dashboard/components/TopBar.tsx` (신규)

---

## Step 2: Tasks Tab — Card Grid → Table List

**현재**: 카드 그리드 (grid-cols-3)
**목표**: 깔끔한 리스트 테이블 (main의 tasks 패턴)

```
┌────────────────────────────────────────────────────┐
│ Task              Guide              Assigned   Img │
├────────────────────────────────────────────────────┤
│ Food Table A      • Check trays...   Alice      🖼  │
│ Drink Station     • Refill cups...   Bob        📷  │
│ Merch Table       • Arrange items..  —          📷  │
└────────────────────────────────────────────────────┘
```

**구현**:
- `rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden`
- `<thead>`: `bg-zinc-50 dark:bg-zinc-900`, `text-xs font-medium uppercase text-zinc-500`
- `<tbody>`: `divide-y divide-zinc-200 dark:divide-zinc-800`
- 각 행: `px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer`
- 클릭 → TaskDetailModal 열기
- Columns: Title | Guide (bullet 3줄, truncate) | Assigned | Image (thumb or upload)
- reward_amount > 0이면 title 옆 emerald badge

**파일**: `src/app/dashboard/components/TaskTable.tsx` (신규, TaskCard 대체)

---

## Step 3: Task Detail Modal

**현재**: 없음 (카드에 모든 정보 표시)
**목표**: main의 TaskDetailModal 패턴 — 클릭하면 모달로 상세/편집

```
┌─────────────────────────────────┐
│ Food Table A Check        [Edit]│
│─────────────────────────────────│
│ Description                     │
│ Check all food trays...         │
│                                 │
│ Guide                           │
│ • Check trays are full          │
│ • Wipe surfaces clean           │
│ • Restock napkins               │
│                                 │
│ Assigned    Alice               │
│ Reward      $120                │
│                                 │
│ [Expected Image]                │
│ ┌──────────────────┐            │
│ │     🖼 image      │            │
│ │   [Replace]       │            │
│ └──────────────────┘            │
│                     [Cancel][Save]│
└─────────────────────────────────┘
```

**구현**:
- `fixed inset-0 z-50 bg-black/50` backdrop + click-outside-close
- `max-w-lg max-h-[80vh] overflow-y-auto rounded-lg border bg-white dark:bg-zinc-950 p-6 shadow-xl`
- View/Edit 토글 (`editing` state)
- Edit mode: title, description, text_guide, assigned_to, reward_amount 수정 → `PUT /api/tasks/{id}`
- Expected image upload (기존 TaskCard의 upload 로직 이동)
- `inputClass` 상수: `w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900`

**파일**: `src/app/dashboard/components/TaskDetailModal.tsx` (신규)

---

## Step 4: Evaluations Tab — Split Pane

**현재**: 세로 스택 (SubmissionCard 리스트)
**목표**: main의 master-detail split — 왼쪽 테이블 + 오른쪽 상세 패널

```
┌──────────────────────────┬──────────────────────┐
│ Staff   Task   Score Sta │  Food Table A        │
│─────────────────────────-│                      │
│ Alice   Food   85   ✓   │  [Exp] [Bfr] [AI] [Aft]│
│ Bob     Drink  —   ◎   │                      │
│                          │  AI Evaluation       │
│                          │  "Good coverage..."  │
│                          │                      │
│                          │  AI Guide            │
│                          │  "Focus on left..."  │
│                          │                      │
│                          │  [Approve] [Reject]  │
└──────────────────────────┴──────────────────────┘
```

**구현**:
- `flex flex-1 overflow-hidden`
- 왼쪽: `flex-1 overflow-auto p-8` — submissions 테이블
  - `rounded-lg border overflow-hidden` + `divide-y`
  - Columns: Staff | Task | Score | Status | (action이 있으면 actions)
  - 행 클릭 → 오른쪽 패널에 상세 표시
  - 선택된 행: `bg-zinc-100 dark:bg-zinc-900`
- 오른쪽: `w-96 shrink-0 border-l overflow-y-auto`
  - Header: task title + staff name + close button
  - 4-column 이미지 그리드 (2×2)
  - AI Evaluation block
  - AI Guide block
  - Approve/Reject 버튼 (status === "reviewed"일 때)

**파일**:
- `src/app/dashboard/components/SubmissionTable.tsx` (신규)
- `src/app/dashboard/components/SubmissionDetail.tsx` (신규)
- `SubmissionCard.tsx` 삭제 (테이블+패널로 대체)

---

## Step 5: PromptToTaskList Polish

**현재**: 작동하지만 디자인 정리 필요
**변경**:
- assigned_to 필드 지원 (types.ts에 이미 추가됨)
- TaskPreview에 assigned_to 표시
- 전체 Tailwind 클래스 기반으로 전환 (현재 inline style 혼재)

**파일**: 기존 파일 수정

---

## Step 6: CSS 정리

**현재**: globals.css에 CSS variable 기반 + inline style 혼재
**목표**: Tailwind 유틸리티 100%로 전환, CSS variable은 최소화

- `card-warm` → Tailwind 클래스로 대체 (`rounded-lg border border-zinc-200 bg-white ...`)
- `.badge`, `.font-data`, `.tab-btn` → Tailwind 유틸리티로 인라인
- `.bg-warm` 배경 효과 유지 (CSS로만 가능)
- 불필요한 CSS variable 제거

**파일**: `globals.css` 축소

---

## File Changes Summary

### 신규 (5)
1. `src/app/dashboard/components/TopBar.tsx`
2. `src/app/dashboard/components/TaskTable.tsx`
3. `src/app/dashboard/components/TaskDetailModal.tsx`
4. `src/app/dashboard/components/SubmissionTable.tsx`
5. `src/app/dashboard/components/SubmissionDetail.tsx`

### 수정 (4)
6. `src/app/dashboard/page.tsx` — TopBar 적용, TaskTable/SubmissionTable 전환
7. `src/app/dashboard/components/PromptToTaskList.tsx` — assigned_to + Tailwind 정리
8. `src/app/dashboard/components/TaskPreview.tsx` — assigned_to + Tailwind 정리
9. `src/app/globals.css` — 정리

### 삭제 (2)
10. `src/app/dashboard/components/TaskCard.tsx` → TaskTable로 대체
11. `src/app/dashboard/components/SubmissionCard.tsx` → SubmissionTable+Detail로 대체

### 유지 (2)
- `ScoreBadge.tsx` — Tailwind 클래스로 전환
- `StatusBadge.tsx` — Tailwind 클래스로 전환

---

## 실행 순서

```
Step 1: TopBar + page.tsx 레이아웃 변경
Step 2: TaskTable + TaskDetailModal (Tasks 탭 전면 교체)
Step 3: SubmissionTable + SubmissionDetail (Evaluations 탭 전면 교체)
Step 4: ScoreBadge/StatusBadge Tailwind 전환
Step 5: PromptToTaskList/TaskPreview Tailwind 정리 + assigned_to
Step 6: globals.css 정리
Step 7: pnpm build 검증
Step 8: vercel deploy --prod
```
