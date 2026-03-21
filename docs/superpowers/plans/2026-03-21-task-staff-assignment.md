# Task Staff Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-task staff assignment — AI auto-assigns from prompt, displayed in dashboard preview and Slack messages.

**Architecture:** Add `assigned_to text` column to `tasks` table. Extend Gemini's Zod schema + system prompt to parse staff names and distribute tasks round-robin. Dashboard TaskPreview shows editable assignee per task. Bot messages include assignee name.

**Tech Stack:** Supabase (PostgreSQL), Gemini AI (generateObject), Next.js, Chat SDK

**Spec:** `docs/superpowers/specs/2026-03-21-task-staff-assignment-design.md`

---

### Task 1: Database Schema — Add `assigned_to` column

**Files:**
- Modify: `supabase/schema.sql:11-21`

- [ ] **Step 1: Update canonical DDL in schema.sql**

Add `assigned_to text` to the `CREATE TABLE tasks` block, after `reward_amount`:

```sql
-- In supabase/schema.sql, the tasks table becomes:
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  task_list_id uuid references task_lists(id) on delete cascade,
  title text not null,
  description text,
  text_guide text,
  expected_image_url text,
  reward_amount numeric default 0,
  assigned_to text,
  sort_order int default 0,
  created_at timestamptz default now()
);
```

- [ ] **Step 2: Apply migration to live Supabase**

Use Supabase MCP `apply_migration`:

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to text;
```

- [ ] **Step 3: Verify column exists**

Run via Supabase MCP `execute_sql`:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'assigned_to';
```

Expected: 1 row — `assigned_to | text`

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add assigned_to column to tasks table"
```

---

### Task 2: Types — Add `assigned_to` to Task and GeneratedTask

**Files:**
- Modify: `src/lib/types.ts:7-17` (Task type)
- Modify: `src/lib/types.ts:41-44` (GeneratedTask type)

- [ ] **Step 1: Add `assigned_to` to Task type**

In `src/lib/types.ts`, add after `reward_amount: number;` (line 14):

```typescript
export type Task = {
  id: string;
  task_list_id: string;
  title: string;
  description: string | null;
  text_guide: string | null;
  expected_image_url: string | null;
  reward_amount: number;
  assigned_to: string | null;
  sort_order: number;
  created_at: string;
};
```

- [ ] **Step 2: Add `assigned_to` to GeneratedTask type**

```typescript
export type GeneratedTask = {
  title: string;
  text_guide: string;
  assigned_to: string | null;
};
```

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build 2>&1 | head -30`

Expected: compilation errors in files that construct `GeneratedTask` without `assigned_to` (TaskPreview handleAdd). These will be fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add assigned_to to Task and GeneratedTask types"
```

---

### Task 3: AI Generation — Extend Gemini schema + system prompt

**Files:**
- Modify: `src/lib/gemini.ts:165-203`

- [ ] **Step 1: Add `assigned_to` to Zod schema**

In `src/lib/gemini.ts`, update the `TaskListSchema` (line ~165):

```typescript
const TaskListSchema = z.object({
  name: z.string().describe("Short descriptive name for this task list"),
  tasks: z
    .array(
      z.object({
        title: z.string().describe("Short, specific task title (what to check)"),
        text_guide: z
          .string()
          .describe(
            "Exactly 3 bullet points starting with '• ', each max 10 words, short actionable phrases",
          ),
        assigned_to: z
          .string()
          .nullable()
          .describe("Staff member name assigned to this task, or null if no staff specified"),
      }),
    )
    .min(1)
    .max(15),
});
```

Note: We intentionally keep `GeneratedTask` type and `TaskListSchema` Zod schema as separate definitions (not using `z.infer`). Both must be updated together when fields change.

- [ ] **Step 2: Replace system prompt with staff assignment rules**

In the `generateTaskList` function, **replace the entire `system` array** with:

```typescript
system: [
  "You are Kani, an AI operational assistant for on-site venue management.",
  "Generate a practical task list based on the manager's description.",
  "Each task must be a specific, photo-verifiable check.",
  "",
  "STRICT FORMAT RULES for text_guide:",
  "- Exactly 3 bullet points, no more, no less.",
  "- Each bullet starts with '• ' and is max 10 words.",
  "- Short, actionable phrases only. No full sentences.",
  "- Example: '• Check food trays are full\\n• Wipe table surfaces clean\\n• Restock napkins and plates'",
  "",
  "STAFF ASSIGNMENT RULES:",
  "- If the user mentions staff names (e.g., 'Staff: Alice, Bob'), distribute tasks across them in round-robin order using the assigned_to field.",
  "- If no staff names are mentioned, set assigned_to to null for ALL tasks.",
  "- Do NOT invent or guess staff names that the user did not provide.",
  "",
  "Keep task titles short (max 6 words).",
  "Write in the same language as the user's prompt.",
].join("\n"),
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/gemini.ts
git commit -m "feat: extend Gemini schema with assigned_to + staff assignment prompt"
```

---

### Task 4: Confirm API — Include `assigned_to` in insert

**Files:**
- Modify: `src/app/api/task-lists/confirm/route.ts:29-33`

- [ ] **Step 1: Add `assigned_to` to task row mapping**

Update the `taskRows` mapping (line ~29):

```typescript
const taskRows = tasks.map((t, i) => ({
  task_list_id: taskList.id,
  title: t.title,
  text_guide: t.text_guide,
  assigned_to: t.assigned_to ?? null,
  sort_order: i,
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/task-lists/confirm/route.ts
git commit -m "feat: include assigned_to in task list confirm insert"
```

---

### Task 5: Bot Helpers — Update `formatTaskPrompt` with assignee

**Files:**
- Modify: `src/lib/bot-helpers.ts:44-56`

- [ ] **Step 1: Update `formatTaskPrompt` signature and output**

```typescript
export function formatTaskPrompt(
  task: Pick<Task, "title" | "text_guide" | "assigned_to">,
): string {
  const assignee = task.assigned_to ? `담당: ${task.assigned_to} | ` : "";
  const lines = [
    `**${assignee}${task.title}** - Time to check!`,
    "",
    task.text_guide ? `Guide: ${task.text_guide}` : "",
    "",
    "Please upload a photo of the current state in this thread.",
  ];

  return lines.filter(Boolean).join("\n");
}
```

- [ ] **Step 2: Verify bot-helpers tests still pass**

Run: `pnpm vitest run src/lib/bot-helpers.test.ts 2>&1 | tail -20`

**Important:** Existing tests construct `{ title, text_guide }` object literals without `assigned_to`. Since `Pick<Task, "title" | "text_guide" | "assigned_to">` requires all three fields, these tests **will fail with a TypeScript error**. You MUST add `assigned_to: null` to all test objects that call `formatTaskPrompt`. Fix all failures before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/lib/bot-helpers.ts
git commit -m "feat: show assignee name in bot task messages"
```

---

### Task 6: Dashboard — TaskPreview with editable assignee

**Files:**
- Modify: `src/app/dashboard/components/TaskPreview.tsx`

- [ ] **Step 1: Add `onUpdateTask` to props interface**

Update the component props to include `onUpdateTask`:

```typescript
export function TaskPreview({
  tasks,
  name,
  onNameChange,
  onRemoveTask,
  onAddTask,
  onUpdateTask,
  onConfirm,
  onRegenerate,
  saving,
}: {
  tasks: GeneratedTask[];
  name: string;
  onNameChange: (name: string) => void;
  onRemoveTask: (index: number) => void;
  onAddTask: (task: GeneratedTask) => void;
  onUpdateTask: (index: number, task: GeneratedTask) => void;
  onConfirm: () => void;
  onRegenerate: () => void;
  saving: boolean;
}) {
```

- [ ] **Step 2: Add assignee display + inline edit to each task row**

Inside the task map (after the text_guide `<p>` at line ~103), add an assignee input:

```tsx
{/* After text_guide paragraph, inside the flex:1 div */}
<div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
  <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>담당:</span>
  <input
    type="text"
    value={task.assigned_to ?? ""}
    onChange={(e) => onUpdateTask(i, { ...task, assigned_to: e.target.value || null })}
    placeholder="미배정"
    style={{
      ...inputStyle,
      padding: '4px 8px',
      fontSize: 12,
      width: 120,
    }}
  />
</div>
```

- [ ] **Step 3: Update handleAdd to include `assigned_to: null`**

```typescript
function handleAdd() {
  if (!newTitle.trim()) return;
  onAddTask({ title: newTitle.trim(), text_guide: newGuide.trim(), assigned_to: null });
  setNewTitle("");
  setNewGuide("");
  setAdding(false);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/components/TaskPreview.tsx
git commit -m "feat: editable staff assignee in TaskPreview"
```

---

### Task 7: Dashboard — PromptToTaskList wiring

**Files:**
- Modify: `src/app/dashboard/components/PromptToTaskList.tsx`

- [ ] **Step 1: Add `handleUpdateTask` callback**

After the `handleAddTask` callback (line 72):

```typescript
const handleUpdateTask = useCallback((index: number, task: GeneratedTask) => {
  setTasks((prev) => prev.map((t, i) => (i === index ? task : t)));
}, []);
```

- [ ] **Step 2: Wire `onUpdateTask` to TaskPreview**

Update the `<TaskPreview>` render (line ~164):

```tsx
<TaskPreview
  tasks={tasks}
  name={name}
  onNameChange={setName}
  onRemoveTask={handleRemoveTask}
  onAddTask={handleAddTask}
  onUpdateTask={handleUpdateTask}
  onConfirm={handleConfirm}
  onRegenerate={handleRegenerate}
  saving={phase === "saving"}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/components/PromptToTaskList.tsx
git commit -m "feat: wire onUpdateTask for staff assignment editing"
```

---

### Task 8: Dashboard — TaskCard assignee badge

**Files:**
- Modify: `src/app/dashboard/components/TaskCard.tsx`

- [ ] **Step 1: Add assignee badge to TaskCard**

After the task title element in TaskCard, add:

```tsx
{task.assigned_to ? (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 500,
    marginTop: 4,
  }}>
    담당: {task.assigned_to}
  </span>
) : (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    background: 'var(--card-border)',
    color: 'var(--muted)',
    fontSize: 11,
    marginTop: 4,
  }}>
    미배정
  </span>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/components/TaskCard.tsx
git commit -m "feat: show assignee badge in TaskCard"
```

---

### Task 9: Build Verification + Integration Test

**Files:**
- All modified files

- [ ] **Step 1: Run full build**

Run: `pnpm build`

Expected: Build succeeds with no type errors.

- [ ] **Step 2: Run all tests**

Run: `pnpm vitest run 2>&1 | tail -30`

Fix any failures (likely in `bot-helpers.test.ts` due to `assigned_to` in Pick type, and possibly `gemini.test.ts`).

- [ ] **Step 3: Manual smoke test — generate task list with staff**

Start dev server (`unset SUPABASE_URL && pnpm dev`), go to `http://localhost:3000/dashboard`, enter prompt:

```
50인 해커톤, 음식 테이블 3개, 음료 1개. Staff: 구봉, 호연, 건태
```

Verify:
- AI generates tasks with staff distributed across 구봉, 호연, 건태
- TaskPreview shows editable assignee per task
- Confirm saves to DB with `assigned_to` populated

- [ ] **Step 4: Manual smoke test — generate without staff**

Enter prompt without staff names:

```
30인 밋업, 음식 테이블 2개
```

Verify: all tasks have `assigned_to: null`, preview shows "미배정" placeholder.

- [ ] **Step 5: Update build-status.md**

Add staff assignment to Phase 3.5 completion status.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete task staff assignment feature"
```
