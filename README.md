# Shelf Coach Slack Demo

Minimal technical demo for the hackathon stack:

- `Vercel Chat SDK`
- `Slack`
- `Gemini`

The app exposes a Slack webhook endpoint and replies inside Slack threads using Gemini.

## Getting Started

1. Copy the environment file:

```bash
cp .env.example .env.local
```

2. Fill in:

- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `REDIS_URL` optional

3. Run the development server:

```bash
pnpm install
pnpm dev
```

4. Expose local development with ngrok or a similar tunnel:

```bash
ngrok http 3000
```

5. Point your Slack app Event Subscriptions and Interactivity URL to:

```bash
https://your-public-url/api/webhooks/slack
```

6. Invite the bot to a channel and mention it once.

7. Continue replying in the same thread.

## Required Slack scopes

Use the Chat SDK Slack manifest from the official guide or include at least:

- `app_mentions:read`
- `channels:history`
- `channels:read`
- `chat:write`
- `groups:history`
- `groups:read`
- `im:history`
- `im:read`
- `mpim:history`
- `mpim:read`
- `users:read`

## Notes

- If `REDIS_URL` is missing, the demo falls back to in-memory state.
- The in-memory adapter is fine for local testing but not durable across restarts.
- The webhook route is `src/app/api/webhooks/[platform]/route.ts`.

## Sources

- Chat SDK Slack guide: https://chat-sdk.dev/docs/guides/slack-nextjs
- Chat SDK package: https://www.npmjs.com/package/chat
- Slack adapter package: https://www.npmjs.com/package/@chat-adapter/slack
- AI SDK Google provider: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
