# 대화 히스토리 유지 — 구현 계획

> 작성일: 2026-03-21
> 상태: 계획 수립 완료, 구현 미착수

## 현재 문제

`handleConversation` → `generateReply`가 매번 단일 `prompt`만 Gemini에 전달.
스레드 내 이전 대화를 전혀 기억하지 못함 (Slack, Telegram 동일).

```typescript
// 현재 — 매 요청이 독립적
async function generateReply(input: string) {
  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    prompt, // ← 단일 문자열, 이전 대화 없음
  });
}
```

## 해결 방식

Chat SDK는 **플랫폼 API에서 직접 메시지를 fetch**하는 구조.
state adapter에 별도 저장 불필요. `thread.allMessages` 또는 `thread.adapter.fetchMessages()`로
이전 대화를 가져와 `toAiMessages()`로 변환 후 AI에 전달.

---

## 구현 단계

### Step 1: `generateReply` → `generateReplyWithHistory` 변환

**변경 파일**: `src/lib/bot.ts`

```typescript
import { toAiMessages } from "chat";
import type { Message } from "chat";

// 기존 generateReply 대체
async function generateReplyWithHistory(
  thread: { allMessages: AsyncIterable<Message> },
  currentText: string,
) {
  // 플랫폼 API에서 스레드 메시지 히스토리 fetch (과거→최신 순)
  const messages: Message[] = [];
  for await (const msg of thread.allMessages) {
    messages.push(msg);
    if (messages.length >= 20) break; // 토큰 비용 제한
  }

  // Chat SDK 메시지 → AI SDK messages 배열로 변환
  const aiMessages = await toAiMessages(messages, {
    includeNames: true, // 다중 사용자 구분
  });

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: aiMessages, // prompt 대신 messages 배열 사용
  });

  return result.text.trim();
}
```

**핵심 변경점**:
- `prompt: string` → `messages: AiMessage[]`
- `toAiMessages()`가 `author.isMe`를 보고 `assistant`/`user` role 자동 매핑
- `includeNames: true`로 여러 사용자가 참여하는 스레드에서 발화자 구분

### Step 2: `handleConversation` 수정

```typescript
// 기존
async function handleConversation(
  thread: { post: (message: string) => Promise<unknown> },
  text: string,
) {
  const reply = await generateReply(text);
  await thread.post(reply);
}

// 변경 — thread 전체를 받아 allMessages 접근
async function handleConversation(thread: any, text: string) {
  const reply = await generateReplyWithHistory(thread, text);
  await thread.post(reply);
}
```

### Step 3: `POSTGRES_URL` 설정 (Vercel 서버리스 안정성)

현재 `createMemoryState()`는 콜드 스타트 시 subscription 소실.
`onSubscribedMessage`가 간헐적으로 안 발화하는 원인.

```bash
# Supabase PostgreSQL connection string을 Vercel에 등록
# Supabase Dashboard → Settings → Database → Connection string (URI)
vercel env add POSTGRES_URL
```

이미 코드에 분기가 있으므로 env만 추가하면 작동:

```typescript
// bot.ts:196-198 — 이미 구현됨
state: process.env.POSTGRES_URL
  ? createPostgresState()
  : createMemoryState(),
```

### Step 4: 대안 — `fetchMessages` 방식 (Telegram fallback)

`thread.allMessages`가 Telegram에서 지원 안 될 경우 대비:

```typescript
async function generateReplyWithHistory(thread: any, currentText: string) {
  let aiMessages: { role: string; content: string }[] = [];

  try {
    // 방법 1: adapter.fetchMessages (limit 지정 가능)
    const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
    aiMessages = await toAiMessages(result.messages, { includeNames: true });
  } catch {
    // 방법 2: fallback — 현재 메시지만 사용
    aiMessages = [{ role: "user", content: currentText }];
  }

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: aiMessages,
  });

  return result.text.trim();
}
```

---

## Telegram 검증 포인트

| 검증 항목 | 방법 |
|-----------|------|
| `thread.allMessages` 지원 여부 | Telegram DM에서 2-3회 대화 후 이터레이터 동작 확인 |
| `thread.id` 일관성 | Before → After 이미지 플로우에서 같은 thread.id 유지되는지 |
| DM 이중 발화 | `onDirectMessage` + `onNewMention` 동시 트리거 여부 |
| 앨범(다중 사진) 처리 | 여러 사진 동시 전송 시 개별 메시지로 분리되는지 |

---

## 영향 범위

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/bot.ts` | `import { toAiMessages }` 추가, `generateReplyWithHistory` 신규, `handleConversation` 시그니처 변경, `generateReply` 제거 |
| Vercel env | `POSTGRES_URL` 추가 |

**변경량**: ~30줄 수정
**기존 로직 영향**: Task 플로우(Before/After 이미지) 무관 — `handleConversation` 호출부 3곳(`onNewMention`, `onDirectMessage`, `onSubscribedMessage`)은 시그니처 변경 없이 동작
