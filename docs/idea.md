# Ideas & Requirements

## System Overview

A unified staff evaluation platform where an AI agent interacts with staff via Slack, evaluates their task performance, and surfaces results on a management dashboard. The entire system is hosted on Vercel as a single Next.js project.

## Architecture

```
Staff (Slack) → Slack Webhook → Vercel (Next.js API Routes) → AI SDK → LLM
                                      ↕
                               Dashboard (Next.js App)
                                      ↕
                                   Database
```

### Hosting

- **Single Next.js project on Vercel** handles everything:
  - Dashboard frontend (`/dashboard/[id]/...`)
  - Slack Bot backend (`/api/events`)
  - AI processing (AI SDK in API Routes)
- No additional servers or infrastructure required

## Requirements

### 1. Slack Bot — Staff Interaction

#### 1.1 Slash Command Task Selection

Staff members select their assigned tasks via `/task` slash command in Slack.

- **Flow:**
  1. Staff types `/task` in Slack
  2. Backend responds with a Block Kit `external_select` menu listing their assigned tasks
  3. Staff selects a task from the dropdown
  4. Bot switches context to that task; all subsequent messages in the thread are tied to it

- **OAuth Scopes Required:**
  - `commands` (for slash commands)
  - `app_mentions:read`
  - `assistant:write`
  - `chat:write`
  - `im:history`, `im:read`, `im:write`

- **Slack Event Subscriptions:**
  - `app_mention`, `assistant_thread_started`, `message:im`

#### 1.2 Conversation & Reporting

- Staff reports task progress by sending messages (text + images) in Slack threads
- Agent responds with instructions, confirmations, and follow-up questions
- All conversations are logged and associated with the specific task and staff member
- Images (e.g., photos of completed work) are stored and displayed in the dashboard

#### 1.3 AI Agent Behavior

- Uses Vercel AI SDK with configurable LLM provider
- Maintains conversation context within Slack threads
- Custom tools defined in `lib/ai.ts` for:
  - Fetching assigned tasks for a user
  - Updating task/achievement status
  - Submitting evaluation results
- Evaluates staff performance based on conversation content and task completion

### 2. Dashboard — Management Interface

#### 2.1 Environment Selection

- Dynamic routing via `/dashboard/[id]` to support multiple environments (stores, teams, etc.)
- Environment selector in sidebar

#### 2.2 Staff Management

- View staff list
- See assigned tasks per staff member

#### 2.3 Task Management

- Create tasks via CSV upload
- Each task has: title, description, assignee, status, priority, due date, evaluator type (human/agent_auto), achievements
- Achievements are sub-items with completion tracking
- Tasks are editable via detail modal

#### 2.4 Evaluations

- Table view: staff name, task, status, action buttons
- Evaluation statuses: Pending, Approved, Rejected, Agent Auto, Agent Approved, Agent Rejected
- Conversation & Agent History ratings (Good/Bad)
- Click a row to view the full agent-staff chat log (including images) in a side panel
- Managers can approve/reject or delegate to agent

#### 2.5 Agent Monitor

- 3-column layout: Staff sessions → Task threads → Live conversation
- Real-time view of agent-staff conversations
- Multiple concurrent threads per staff member (Slack thread-based)
- Status indicators: Active (pulsing), Idle, Error

### 3. Internationalization

- Supported locales: English, Japanese, Korean
- Language switcher in sidebar
- All UI labels translated via React Context-based i18n system
- Locale persisted in localStorage

## Technical Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **AI:** Vercel AI SDK
- **Bot Platform:** Slack (HTTP webhook mode, not WebSocket)
- **Hosting:** Vercel
- **Language:** TypeScript

## Environment Variables

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
OPENAI_API_KEY=...
```

## Reference

- Vercel AI SDK Slackbot Template: https://vercel.com/templates/other/ai-sdk-slackbot
- Repository: https://github.com/vercel-labs/ai-sdk-slackbot
