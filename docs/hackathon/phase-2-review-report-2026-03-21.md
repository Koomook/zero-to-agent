# Shelf Coach Phase 2 Review Report

Date: 2026-03-21

Scope:
- Phase 2 Slack image flow
- Related dashboard/API behavior required to demo the flow end-to-end

Verification performed:
- Read core implementation in `src/lib/bot.ts`, `src/lib/gemini.ts`, `src/lib/supabase.ts`, `src/app/api/*`, `src/app/dashboard/page.tsx`
- Ran `pnpm lint`
- Ran `pnpm build`
- Ran local app with `pnpm start` on port `3010`
- Called `GET /`, `GET /dashboard`, `GET /api/tasks`, `GET /api/submissions`, `GET /api/webhooks/slack`

Results:
- `pnpm build`: passed
- `pnpm lint`: failed
- Local routes:
  - `/`: 200
  - `/dashboard`: 200
  - `/api/tasks`: 200
  - `/api/submissions`: 200
  - `/api/webhooks/slack`: 200

## Findings

### 1. Duplicate submissions can be created for the same thread

Severity: High

Why it matters:
- Mentioning the bot again in the same thread or DM creates another row instead of reusing the existing submission.
- The rest of the flow reads only the latest row for that thread, so earlier rows become orphaned and dashboard data becomes inconsistent.

Evidence:
- `getNextPendingTask(thread.id)` returns the existing task when the thread already has a submission.
- The mention/DM handlers still call `createSubmission(...)` unconditionally afterward.
- There is no unique constraint on `task_submissions.thread_id`.

Relevant files:
- `src/lib/bot.ts`
- `supabase/schema.sql`

### 2. Uploaded staff images are always stored as `image/jpeg`

Severity: Medium

Why it matters:
- Slack attachments are read with dynamic MIME types, but Supabase upload metadata is hardcoded to JPEG.
- PNG/WebP uploads may be stored with incorrect metadata, which can break downstream rendering or model input assumptions.

Evidence:
- `bot.ts` extracts the incoming `mimeType`.
- `uploadImage()` ignores it and uploads every file with `contentType: "image/jpeg"`.

Relevant files:
- `src/lib/bot.ts`
- `src/lib/supabase.ts`

### 3. Expected reference images are always sent to Gemini as JPEG

Severity: Medium

Why it matters:
- The code fixed MIME handling for user uploads, but expected images are still hardcoded as JPEG in both analyze/evaluate paths.
- If a manager uploads PNG/WebP expected images later, Gemini can receive mismatched media metadata.

Evidence:
- `fetchImageAsBase64()` returns only base64.
- `analyzeBeforeImage()` and `evaluateAfterImage()` attach the expected image with `mimeType: "image/jpeg"` regardless of actual content.

Relevant files:
- `src/lib/gemini.ts`

### 4. Dashboard shows `Ready to Payout` when all existing submissions are `ok`, even if not all tasks were completed

Severity: Medium

Why it matters:
- With 5 tasks defined and 1 approved submission, the dashboard already marks the checklist as payout-ready.
- This is a false-positive operational signal for the demo.

Evidence:
- The banner condition is `submissions.length > 0 && submissions.every((s) => s.status === "ok")`.
- The task count is not considered.

Relevant files:
- `src/app/dashboard/page.tsx`

### 5. Lint fails on the dashboard polling effect

Severity: Medium

Why it matters:
- The repo does not pass its own lint command, which is a release-quality issue even though production build currently succeeds.
- This will block CI if lint is enforced and makes the dashboard page harder to maintain.

Evidence:
- `pnpm lint` fails with `react-hooks/set-state-in-effect` on the `useEffect` that immediately calls `fetchData()`.

Relevant files:
- `src/app/dashboard/page.tsx`

## Additional risks

### No automated tests for the Phase 2 flow

- I did not find unit or integration tests covering:
  - mention/DM task assignment
  - before/after image transitions
  - duplicate-thread behavior
  - dashboard payout gating

### Expected image fetch has no response validation

- `fetchImageAsBase64()` does not check `res.ok`.
- A broken expected image URL would be forwarded to Gemini as if it were image data, producing confusing failures.

## Overall assessment

Phase 2 is close enough to demo and the basic app boots successfully, but I would not call it robust yet. The biggest correctness issue is duplicate submission creation on re-entry to the same thread. After that, the MIME handling gaps and incorrect payout banner logic are the next issues to fix before relying on the flow in front of judges.
