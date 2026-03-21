# AI SDK Slackbot Template Reference

Source: https://vercel.com/templates/other/ai-sdk-slackbot
Repository: https://github.com/vercel-labs/ai-sdk-slackbot

## Description

An open-source AI-powered chatbot for Slack that leverages the AI SDK by Vercel. The bot integrates with Slack's API to enable AI communication across both direct messages and channel mentions.

## Key Features

- **Slack Integration**: Works with app mentions and direct messages
- **Multi-LLM Support**: Use any LLM with the AI SDK (easily switch between providers)
- **Context Awareness**: Maintains conversation history within threads and DMs
- **Built-in Tools**:
  - Real-time weather lookup
  - Web search powered by Exa
- **Extensible Architecture**: Allows custom tool additions like knowledge base search

## Technology Stack

- AI SDK by Vercel
- Node.js 18+
- Slack API integration
- Supports multiple LLM providers (OpenAI as primary example)
- Exa API for web search functionality

## Prerequisites

- Node.js 18+
- Slack workspace with admin access
- OpenAI API key
- Exa API key
- Hosting platform (Vercel recommended)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Create Slack App

- Visit https://api.slack.com/apps and create new app
- Select "From scratch"
- Choose your workspace

### 3. Configuration

**Basic Information**: Note the Signing Secret for `SLACK_SIGNING_SECRET`

**App Home**: Enable "Allow users to send Slash commands and messages from the messages tab"

**OAuth & Permissions** — Add bot token scopes:
- `app_mentions:read`
- `assistant:write`
- `chat:write`
- `im:history`
- `im:read`
- `im:write`

Install to workspace and save "Bot User OAuth Token" as `SLACK_BOT_TOKEN`

**Event Subscriptions**:
- Enable Events
- Set Request URL to: `https://your-app.vercel.app/api/events`
- Subscribe to: `app_mention`, `assistant_thread_started`, `message:im`

## Environment Variables

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
OPENAI_API_KEY=your-openai-api-key
EXA_API_KEY=your-exa-api-key
```

## How It Works

The bot responds to:
1. Direct messages sent to the bot
2. Channel mentions using `@YourBotName`

Maintains context within both threads and direct messages for coherent multi-turn conversations.

## Built-in Tools

**Weather Tool**: Retrieves real-time weather for any location

**Web Search**: Searches the web using Exa for current information

## Local Development

```bash
pnpm i -g vercel
pnpm vercel dev --listen 3000 --yes
npx untun@latest tunnel http://localhost:3000
```

Update subscription URL to the untun tunnel URL provided.

## Production Deployment (Vercel)

1. Push code to GitHub repository
2. Create new Vercel project and import repository
3. Add environment variables in project settings
4. Update Slack Event Subscriptions URL with production deployment URL

## Extensibility

Uses AI SDK's tool system — extend by modifying `lib/ai.ts`:
- Knowledge base search
- Database queries
- Custom API integrations
- Company documentation search

## License

MIT
