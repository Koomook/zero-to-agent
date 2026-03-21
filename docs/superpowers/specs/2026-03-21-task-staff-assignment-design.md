# Task Staff Assignment Design

> Per-task staff assignment for Shelf Coach — AI auto-assigns staff from prompt, displayed in dashboard and Slack.

## Problem

Tasks are currently first-come, first-served. There is no way for a manager to pre-assign specific staff members to specific tasks. Staff don't know which task is theirs until they interact with the bot.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Assignment source | AI auto-assigns from prompt | Manager includes staff names in prompt; Gemini distributes tasks |
| Staff identifier | Free text name | Simple, no Slack ID mapping needed |
| Slack display | Channel broadcast with assignee name shown | "담당: Alice \| Food Table - Time to check!" |
| Submission policy | Anyone can submit | `assigned_to` is display-only, not enforced |
| Preview editing | Assignee editable in TaskPreview | Manager can override AI suggestions before confirming |

## Schema Change

Migration (via Supabase MCP `apply_migration`):
```sql
ALTER TABLE tasks ADD COLUMN assigned_to text;
```

Also update the canonical DDL in `supabase/schema.sql` — add `assigned_to text` to the `CREATE TABLE tasks` block so fresh setups include the column.

Single nullable text column. No foreign key — staff are identified by free-text name.

## Type Changes (`src/lib/types.ts`)

```typescript
// Task — add assigned_to
export interface Task {
  // ... existing fields
  assigned_to: string | null;
}

// GeneratedTask — add assigned_to
export interface GeneratedTask {
  title: string;
  text_guide: string;
  assigned_to: string | null;
}
```

## AI Generation (`src/lib/gemini.ts`)

Extend `TaskListSchema` Zod schema:

```typescript
const TaskSchema = z.object({
  title: z.string(),
  text_guide: z.string(),
  assigned_to: z.string().nullable().describe("Staff member name assigned to this task"),
});
```

Update system prompt to instruct Gemini:
- Parse staff names from the user prompt
- Distribute tasks across staff members in round-robin fashion
- If no staff names are mentioned, set `assigned_to` to `null` for every task

**Important**: `TaskListSchema` Zod schema and `GeneratedTask` type must stay in sync. Consider using `z.infer<typeof TaskSchema>` as the source of truth for `GeneratedTask`, or ensure both are updated together.

System prompt addition example:
```
If the user mentions staff names (e.g., "Staff: Alice, Bob"), distribute tasks
across them in round-robin order using the assigned_to field.
If no staff names are mentioned, set assigned_to to null for all tasks.
Do NOT invent staff names that the user did not provide.
```

Example prompt: "50인 해커톤, 음식 테이블 3개. Staff: 구봉, 호연, 건태"
Expected output: tasks distributed across 구봉, 호연, 건태.

## Confirm API (`src/app/api/task-lists/confirm/route.ts`)

Include `assigned_to` in the insert payload:

```typescript
{
  task_list_id: taskList.id,
  title: task.title,
  text_guide: task.text_guide,
  sort_order: index,
  assigned_to: task.assigned_to ?? null,
}
```

## Dashboard Changes

### TaskPreview.tsx
- Add assignee display per task row: show name badge next to title
- Add editable text input or select for `assigned_to` per task
- Collect unique staff names from generated tasks for quick-select
- **"Add Task" form**: include `assigned_to` field (default `null` if left empty)
- New `onUpdateTask(index, updatedTask)` callback for in-place editing of `assigned_to`

### TaskCard.tsx
- Show `assigned_to` as a badge/tag below or beside the title
- Gray "미배정" badge if `assigned_to` is null

### PromptToTaskList.tsx
- Pass `assigned_to` through the `GeneratedTask` state to confirm API
- Add `onUpdateTask` handler to update a specific task's fields in the `tasks` state array
- Wire the handler to `TaskPreview`'s `onUpdateTask` callback

## Bot Display (`src/lib/bot-helpers.ts`)

Update `formatTaskPrompt`:

```typescript
export function formatTaskPrompt(task: Pick<Task, "title" | "text_guide" | "assigned_to">): string {
  const assignee = task.assigned_to ? `담당: ${task.assigned_to} | ` : "";
  return `**${assignee}${task.title}** - Time to check!\n\nGuide: ${task.text_guide}\n\nPlease upload a photo of the current state in this thread.`;
}
```

## Bot Logic (`src/lib/bot.ts`)

No routing changes. Current first-come, first-served logic remains. `assigned_to` is informational only — the bot still gives the next unsubmitted task to whoever talks to it. The call site for `formatTaskPrompt` must pass the new `assigned_to` field — since it passes a `Task` object from DB, this is automatic after the type change.

## Cron (`src/app/api/cron/check-tasks/route.ts`)

No explicit code change needed — the cron route calls `formatTaskPrompt` which will automatically include the assignee name after the bot-helpers update.

## Out of Scope

- Slack User ID mapping / @mentions
- DM-based task routing to specific staff
- Submission enforcement (reject non-assigned staff)
- Staff management CRUD (no separate staff table)

## File Change Summary

| File | Change |
|------|--------|
| `supabase/schema.sql` | Add `assigned_to text` to `tasks` |
| `src/lib/types.ts` | Add `assigned_to` to `Task`, `GeneratedTask` |
| `src/lib/gemini.ts` | Extend Zod schema + system prompt |
| `src/app/api/task-lists/confirm/route.ts` | Include `assigned_to` in insert |
| `src/app/dashboard/components/TaskPreview.tsx` | Show + edit assignee |
| `src/app/dashboard/components/TaskCard.tsx` | Show assignee badge |
| `src/app/dashboard/components/PromptToTaskList.tsx` | Pass `assigned_to` through state |
| `src/lib/bot-helpers.ts` | Update `formatTaskPrompt` |
| `src/lib/bot.ts` | No logic change — `formatTaskPrompt` call site gets `assigned_to` automatically from DB `Task` |
| `src/app/api/tasks/route.ts` | No code change needed — `assigned_to` returned automatically from DB query |
