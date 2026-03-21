# Shelf Coach — Build Status & Roadmap

> Zero to Agent Hackathon (2026-03-22) | Vercel x Google DeepMind
> Tech: Vercel Chat SDK + Gemini 2.5 Flash + Supabase + Slack/Telegram/WhatsApp

---

## Phase 1: Foundation (CURRENT)

基本インフラ + Slack ボットテキスト応答 + Supabase 連携 + Vercel デプロイ

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Next.js プロジェクトセットアップ | DONE | Next.js 16 + Tailwind + TypeScript |
| 1.2 | Vercel Chat SDK インストール + Slack アダプター | DONE | `chat` + `@chat-adapter/slack` |
| 1.3 | Gemini AI SDK 接続 | DONE | `@ai-sdk/google` → `gemini-2.5-flash` |
| 1.4 | Supabase プロジェクト作成 | DONE | `shelf-coach` (us-west-1) |
| 1.5 | DB スキーマ (task_lists, tasks, task_submissions) | DONE | Migration 適用済み |
| 1.6 | Supabase Storage バケット | DONE | `shelf-coach` バケット (public) |
| 1.7 | Seed data (Cafe Daily Checklist + 3 tasks) | DONE | 4 tasks 存在 |
| 1.8 | API routes (tasks, task-lists, submissions, review) | DONE | すべて getSupabase() 使用、ライブ検証済み |
| 1.9 | Webhook route `/api/webhooks/[platform]` | DONE | Slack URL verification + after() パターン |
| 1.10 | Slack ボットテキストメンション応答 | DONE | onNewMention → Gemini generateText → thread.post |
| 1.11 | Slack ボット DM 応答 | DONE | onDirectMessage ハンドラー |
| 1.12 | Slack ボットスレッド会話の維持 | DONE | thread.subscribe() + onSubscribedMessage |
| 1.13 | システムプロンプト（会話モード） | DONE | SYSTEM_PROMPT → generateReply() で使用 |
| 1.14 | Vercel デプロイ | DONE | `zero-to-agent-hackathon.vercel.app` |
| 1.15 | Vercel env vars 設定 | DONE | 5つの変数を登録 |
| 1.16 | ランディングページ (/) | DONE | マルチプラットフォームのステータス表示 |
| 1.17 | ダッシュボード基本 UI (/dashboard) | DONE | Task 一覧 + Submission 表示（5秒ポーリング） |

---

## Phase 2: Slack 画像フロー（コアデモ）

店舗 Food Stock シナリオの完成 — 画像の受信/分析/生成/送信 + DB 連携

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Slack からの画像受信 (attachments + fetchData) | DONE | onSubscribedMessage で mimeType チェック + fetchData() |
| 2.2 | Before 画像 → Supabase Storage アップロード | DONE | uploadImage() → `submissions/` パス |
| 2.3 | Before 画像 → Gemini マルチモーダル分析 | DONE | analyzeBeforeImage() — base64 + expected image 比較 |
| 2.4 | AI ガイドテキスト生成 → Slack スレッドに応答 | DONE | thread.post(guide) |
| 2.5 | After 画像 → Gemini マルチモーダル評価 | DONE | evaluateAfterImage() → score(0-100) + evaluation |
| 2.6 | 評価結果 → DB 保存 (ai_score, ai_evaluation, status) | DONE | updateSubmission() |
| 2.7 | 評価結果 → Slack スレッドにスコア/フィードバック応答 | DONE | formatEvaluation() → thread.post() |
| **2.8** | **画像を Slack へ送信 (thread.post with files)** | **TODO** | **Chat SDK files: [] はサポートされているが未使用。Expected image をスレッドに表示する必要あり** |
| **2.9** | **Gemini 画像生成（ガイド画像）** | **TODO** | **テキストガイドのみで、ビジュアルガイド画像の生成なし。Imagen API または Gemini image gen が必要** |
| **2.10** | **getNextPendingTask() スマート Task 割り当て** | **TODO** | **現在 sort_order の先頭のみ返却 — 既に提出済みの Task のフィルタリングなし。同じ Task が繰り返し割り当てられる** |
| **2.11** | **Task ごとのシステムプロンプト強化** | **TODO** | **analyzeBeforeImage/evaluateAfterImage に system: フィールド未使用。インライン指示のみ** |
| **2.12** | **画像 mimeType の動的処理** | **TODO** | **現在 image/jpeg ハードコーディング。PNG/WebP など Slack アップロード形式への対応が必要** |
| **2.13** | **Food Stock デモシナリオの seed data 拡充** | **TODO** | **Expected images なし。デモ用写真のアップロード + ガイドテキストの具体化** |
| **2.14** | **エラーハンドリング（Gemini 失敗、アップロード失敗）** | **TODO** | **現在は throw のみ。ユーザー向けのわかりやすいエラーメッセージが必要** |

---

## Phase 3: Admin Dashboard の高度化

マネージャーが実際に運用できるダッシュボード

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Task 一覧表示 | DONE | /dashboard にカード UI |
| 3.2 | Submission 一覧（Expected/Before/After 画像比較） | DONE | 3カラム画像比較 UI |
| 3.3 | AI 評価スコア + フィードバック表示 | DONE | ScoreBadge + AI Evaluation ブロック |
| 3.4 | OK/Fail ボタン（status=reviewed 時） | DONE | /api/submissions/[id]/review 呼び出し |
| 3.5 | Ready to Payout バナー | DONE | すべての submission が OK の時に表示 |
| **3.6** | **Staff-AI チャット履歴の表示** | **TODO** | **Slack スレッドの内容を DB に保存していない。ダッシュボードでの会話タイムライン表示が必要** |
| **3.7** | **Task 作成フォーム（ダッシュボードから直接）** | **TODO** | **POST /api/tasks は存在するが UI フォームなし。画像アップロード + ガイド入力が必要** |
| **3.8** | **Task List 作成/管理 UI** | **TODO** | **POST /api/task-lists は存在するが UI なし** |
| **3.9** | **Payout アクション（承認 → 支払いトリガー）** | **TODO** | **Ready to Payout の表示のみで、実際のアクション（メッセージ送信/状態変更）なし** |
| **3.10** | **リアルタイム更新（Supabase Realtime または SSE）** | **TODO** | **現在 5秒ポーリング。リアルタイム反映でデモのインパクトが向上** |
| **3.11** | **ダッシュボード認証（Manager vs Staff の区別）** | **TODO** | **現在は誰でもアクセス可能。ハッカソンデモでは不要かもしれない** |

---

## Phase 4: Multi-Platform (Telegram + WhatsApp)

Chat SDK マルチプラットフォーム — 「コードを1行も変えずに3つのプラットフォーム対応」

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Telegram アダプターインストール | DONE | `@chat-adapter/telegram` installed |
| 4.2 | WhatsApp アダプターインストール | DONE | `@chat-adapter/whatsapp` installed |
| 4.3 | Webhook エンドポイント (telegram, whatsapp) | DONE | `/api/webhooks/telegram`, `/api/webhooks/whatsapp` 応答確認 |
| 4.4 | bot.ts マルチアダプター初期化 | DONE | createAdapters() で env ベースの条件付き登録 |
| **4.5** | **Telegram Bot Token の発行 + 設定** | **TODO** | **BotFather でトークン発行 → env 追加 → webhook 登録** |
| **4.6** | **WhatsApp Business API の設定** | **TODO** | **Meta Developer でアプリ作成 → Access Token → webhook 登録** |
| **4.7** | **Telegram 画像の受信/送信テスト** | **TODO** | **Chat SDK Telegram adapter の file サポート確認が必要** |
| **4.8** | **WhatsApp 画像の受信/送信テスト** | **TODO** | **24時間メッセージングウィンドウ制限に注意** |
| **4.9** | **プラットフォームごとの UX 差異への対応** | **TODO** | **WhatsApp: スレッドなし（flat）、ボタン3つ制限。Telegram: reply ベース** |

---

## Known Bugs

| Bug | File | Line | Severity |
|-----|------|------|----------|
| getNextPendingTask() が常に同じ Task を返す | `src/lib/bot.ts` | 53-61 | **HIGH** — デモが壊れる |
| mimeType `image/jpeg` のハードコーディング | `src/lib/gemini.ts` | 38, 87 | MEDIUM — PNG アップロード時に問題が発生する可能性あり |
| 画像送信が未実装 | `src/lib/bot.ts` | 全体 | **HIGH** — シナリオのコア機能が欠落 |

---

## Summary

```
Phase 1 (Foundation):     17/17 DONE  ████████████████ 100%
Phase 2 (Image Flow):      7/14 DONE  ████████░░░░░░░░  50%
Phase 3 (Dashboard):       5/11 DONE  ████████░░░░░░░░  45%
Phase 4 (Multi-Platform):  4/9  DONE  ███████░░░░░░░░░  44%
```

**Next Priority: Phase 2 の完成** — 画像送信、Task 割り当てロジックの修正、デモシナリオの拡充
