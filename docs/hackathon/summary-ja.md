# Zero to Agent ハッカソン要約 & アイデア

## 概要

| 項目 | 内容 |
|------|------|
| イベント | Zero to Agent: Vercel x Google DeepMind Hackathon |
| 主催 | Vercel, Google DeepMind, Cerebral Valley |
| 日程 | 2026-03-22 (土) |
| 会場 | Shack15 — Ferry Building 2階 (1 Ferry Building, Suite 201, SF) |
| 時間 | 9AM入場 〜 10PM終了 (ハッキング: 10AM〜5PM、約7時間) |
| チーム規模 | 最大4名、ソロ参加可 |
| 提出 | 5PM締切、1分デモ動画必須、リポジトリpublic必須 |
| Wi-Fi | SHACK15_Members / M3mb3r$4L!f3 |
| Discord | cv.inc/discord → #accessで🤖絵文字をクリック |

### 3つの問題トラック

1. **Chat-Based Agents** — Slack/Discord/GitHub/Linearなど既存プラットフォームにエージェントを組み込む。Vercel ChatSDK活用。マルチプラットフォーム単一コードベース。
2. **Multi-Modal Agents** — テキストを超えて：画像/映像/音声/ドキュメントを見て聞いて行動するエージェント。Geminiマルチモーダル活用。
3. **AI Applications** — 完全自律エージェントでなくてもOK。便利で創造的でよくできたAIアプリ。craft + UX + shipping重視。

### 審査基準

| 基準 | 第1ラウンド | 決勝 |
|------|------------|------|
| Impact Potential | 20% | 均等 |
| Live Demo | 45% | 均等 |
| Creativity & Originality | 35% | 均等 |

- プレゼンテーションNG → ライブデモのみ
- 3分デモ + 1-2分Q&A
- 第1ラウンド → 上位6チームが決勝ステージ

### 禁止プロジェクト

Basic RAG、Streamlitアプリ、画像分析器、AI教育チャットボット、採用スクリーナー、栄養コーチ、性格分析器、医療アドバイス

### 提供リソース

- **Google**: 一時AI Studioアカウント (Gemini 3.1 Pro、高クォータ) + Cloud Runデプロイ
- **Vercel**: AI SDK, v0, Agents, MCP, Sandbox, Workflow(WDK), Vercel Plugin
- **Supabase**: $25クレジット
- **ElevenLabs**: 1ヶ月Creator tier ($22)
- **BetterAuth**: 無料認証 + Agent Auth Protocol
- **Sentry**: クレジット (コード: ZTA26)

### 賞金 (1位基準)

$5000 GCP + Vercel SHIPチケット + $300/月x12 Vercel + $500 v0 + $1000 Supabase/人 + 3ヶ月ElevenLabs Pro/人 + $1000 Augment Code + $2500 Sentry

---

## エージェントアイデア5つ

### 1. Voice Deploy Agent — 「話せばデプロイされる」
**トラック**: Multi-Modal + AI App

音声でアプリを説明 → コード生成 → 即デプロイ → 音声で結果フィードバック

| スポンサー | 活用 |
|-----------|------|
| **Vercel** | AI SDK + Sandbox(リアルタイムプレビュー) + デプロイ |
| **Gemini** | 音声→意図把握、UIスケッチ写真→コンポーネント変換 (マルチモーダル) |
| **ElevenLabs** | デプロイ完了/エラー発生時の音声フィードバック |
| **Supabase** | 生成アプリのバックエンドDB自動プロビジョニング |
| **Sentry** | デプロイ直後のエラー自動検知 → 音声で通知 |

### 2. Agent Auth Playground — 「エージェントがログインする世界」
**トラック**: Chat-Based + AI App

エージェントがユーザーの代わりに複数サービスに認証して作業を実行する統合ハブ

| スポンサー | 活用 |
|-----------|------|
| **Vercel** | ChatSDK(会話インターフェース) + Workflow(マルチステップ認証フロー) |
| **Gemini** | 自然言語リクエスト解釈 + 権限範囲判断推論 |
| **BetterAuth** | Agent Auth Protocol — エージェントのOAuth認証コア |
| **Supabase** | 認証トークン/セッション保存、エージェント行動ログDB |
| **Sentry** | 認証失敗/権限エラーのリアルタイム追跡 |

### 3. Live Pitch Coach — 「3分デモを練習させるエージェント」
**トラック**: Multi-Modal

ハッカソン参加者のデモ発表を見てリアルタイムコーチングするエージェント

| スポンサー | 活用 |
|-----------|------|
| **Vercel** | AI SDK + Webインターフェースデプロイ |
| **Gemini** | カメラで発表映像リアルタイム分析（表情、ジェスチャー、画面切替タイミング） |
| **ElevenLabs** | コーチングフィードバックを自然な音声で伝達 |
| **Supabase** | 練習セッション記録、スコア推移保存、リーダーボード |
| **Augment Code** | 発表中に見せるコードの品質/可読性自動分析 |

### 4. Error Storyteller — 「エラーを物語にするエージェント」
**トラック**: Chat-Based + AI App

Sentryエラーをキャッチ → 原因分析 → 修正コード提案 → Slack/Discordで「エラーストーリー」配信

| スポンサー | 活用 |
|-----------|------|
| **Vercel** | ChatSDK(Slack/Discordボット) + デプロイ環境連携 |
| **Gemini** | エラースタックトレース + コードコンテキスト分析、根本原因推論 |
| **Sentry** | エラーイベントソース、リアルタイムWebhookでエラー受信 |
| **Augment Code** | 修正コード自動生成 + PR草案作成 |
| **BetterAuth** | Slack/GitHubボット認証、チーム別アクセス権限管理 |

### 5. Vibe Translator — 「アイデアをアプリに翻訳するエージェント」
**トラック**: Multi-Modal + AI App

非開発者が手描き/音声/写真でアプリアイデアを説明 → 実際に動作するアプリに変換

| スポンサー | 活用 |
|-----------|------|
| **Vercel** | v0(UI生成) + AI SDK + Sandbox(プレビュー) + デプロイ |
| **Gemini** | 手描き→ワイヤーフレーム変換、音声→機能仕様抽出 (マルチモーダルフル活用) |
| **ElevenLabs** | 進捗状況音声ナレーション |
| **BetterAuth** | 生成アプリに認証自動追加 (30+ソーシャルログイン) |
| **Supabase** | アプリのDBスキーマ自動生成 + リアルタイムデータ |
| **Sentry** | 生成アプリにエラーモニタリング自動設定 |

---

## スポンサーカバレッジ

| アイデア | Vercel | Gemini | Supa | 11Labs | BAuth | Sentry | Augment | Chat | Multi | AI App |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1. Voice Deploy | O | O | O | O | - | O | - | - | O | O |
| 2. Agent Auth | O | O | O | - | O | O | - | O | - | O |
| 3. Pitch Coach | O | O | O | O | - | - | O | - | O | - |
| 4. Error Storyteller | O | O | - | - | O | O | O | O | - | O |
| 5. Vibe Translator | O | O | O | O | O | O | - | - | O | O |

## 戦略メモ

- **Live Demo 45%が最大ウェイト** → 安定動作が最優先
- **7時間しかない** → スコープを小さく、デモを大きく
- **禁止リスト注意** → Basic RAG、Streamlit絶対禁止
- **リポpublic必須** → 最初からpublic repoで開始
- **スポンサー技術活用** → Vercel + Geminiは必須、追加でSupabase/ElevenLabs/BetterAuth/Sentry中2つ以上使えば有利
