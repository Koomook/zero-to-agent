# Zero to Agent 해커톤 요약 & 아이디어

## 핵심 요약

| 항목 | 내용 |
|------|------|
| 이벤트 | Zero to Agent: Vercel x Google DeepMind Hackathon |
| 주최 | Vercel, Google DeepMind, Cerebral Valley |
| 날짜 | 2026-03-22 (토) |
| 장소 | Shack15 — Ferry Building 2층 (1 Ferry Building, Suite 201, SF) |
| 시간 | 9AM 입장 ~ 10PM 마감 (해킹: 10AM~5PM, 약 7시간) |
| 팀 규모 | 최대 4명, 솔로 가능 |
| 제출 | 5PM 마감, 1분 데모 영상 필수, 레포 public 필수 |
| Wi-Fi | SHACK15_Members / M3mb3r$4L!f3 |
| Discord | cv.inc/discord → #access에서 로봇 이모지 클릭 |

### 3가지 문제 트랙

1. **Chat-Based Agents** — Slack/Discord/GitHub/Linear 등 기존 플랫폼에 에이전트를 심는 것. Vercel ChatSDK 활용. 멀티플랫폼 단일 코드베이스.
2. **Multi-Modal Agents** — 텍스트 너머: 이미지/영상/오디오/문서를 보고 듣고 행동하는 에이전트. Gemini 멀티모달 활용.
3. **AI Applications** — 완전 자율 에이전트가 아니어도 OK. 유용하고 창의적이고 잘 만든 AI 앱. craft + UX + shipping 중시.

### 심사 기준

| 기준 | 1라운드 | 결선 |
|------|---------|------|
| Impact Potential | 20% | 균등 |
| Live Demo | 45% | 균등 |
| Creativity & Originality | 35% | 균등 |

- 프레젠테이션 NO → 라이브 데모만
- 3분 데모 + 1-2분 Q&A
- 1라운드 → 상위 6팀 결선 무대

### 금지 프로젝트

Basic RAG, Streamlit 앱, 이미지 분석기, AI 교육 챗봇, 채용 스크리너, 영양 코치, 성격 분석기, 의료 조언

### 제공 리소스

- **Google**: 임시 AI Studio 계정 (Gemini 3.1 Pro, 높은 쿼터) + Cloud Run 배포
- **Vercel**: AI SDK, v0, Agents, MCP, Sandbox, Workflow(WDK), Vercel Plugin
- **Supabase**: $25 크레딧
- **ElevenLabs**: 1개월 Creator tier ($22)
- **BetterAuth**: 무료 인증 + Agent Auth Protocol
- **Sentry**: 크레딧 (코드: ZTA26)

### 상금 (1위 기준)

$5000 GCP + Vercel SHIP 티켓 + $300/월x12 Vercel + $500 v0 + $1000 Supabase/인 + 3개월 ElevenLabs Pro/인 + $1000 Augment Code + $2500 Sentry

---

## 에이전트 아이디어 5개

### 1. Live Event Agent (트랙: Chat-Based + Multi-Modal)

해커톤/밋업 현장에서 돌아가는 실시간 이벤트 에이전트. Slack/Discord 채널에 상주하면서:
- 참가자가 사진을 올리면 Gemini가 프로젝트를 분석하고 태깅
- "지금 뭐 하고 있어?" 질문에 전체 팀 진행상황 요약
- 데모 시간 알림, 팀 매칭 자동 제안
- **왜 이기는가**: 해커톤 현장에서 바로 쓸 수 있는 메타적 프로젝트. 심사위원이 직접 체험. Live Demo 점수 극대화.

### 2. Codebase Onboarding Agent (트랙: Chat-Based)

GitHub 레포를 연결하면 신규 개발자를 위한 인터랙티브 온보딩 가이드를 생성하는 에이전트:
- PR/Issue에서 "@onboard 이 코드 뭐야?" → 해당 파일의 의존성, 히스토리, 패턴을 설명
- 새 contributor가 첫 PR을 올리면 자동으로 코드 컨벤션 체크 + 가이드
- Gemini로 아키텍처 다이어그램 자동 생성 (코드 → 시각화)
- **왜 이기는가**: "real problem" 조건 충족. 모든 OSS 프로젝트가 겪는 온보딩 병목 해결. Creativity 높음.

### 3. Multi-Modal Meeting Agent (트랙: Multi-Modal)

화이트보드 사진 + 음성 녹음 → 구조화된 회의록 + 액션 아이템 자동 생성:
- Gemini Vision으로 화이트보드/포스트잇 인식
- 음성을 텍스트로 변환 후 화이트보드 내용과 크로스레퍼런스
- Linear/GitHub Issues로 액션 아이템 자동 생성
- Slack으로 회의 요약 자동 발송
- **왜 이기는가**: 멀티모달의 진짜 활용. 데모가 시각적으로 임팩트 있음. ElevenLabs TTS로 회의록 음성 요약 추가 가능.

### 4. Deploy Guardian Agent (트랙: AI Application)

Vercel 배포 전 자동 품질 검증 에이전트:
- PR 머지 시 자동으로 preview 배포 → Gemini Vision으로 스크린샷 비교 (visual regression)
- 접근성 체크, 성능 메트릭 분석, SEO 기본 검증
- 문제 발견 시 Slack/GitHub에 시각적 diff와 함께 알림
- Sentry 연동으로 에러 사전 감지
- **왜 이기는가**: Vercel 인프라를 깊이 활용. 실제 DevOps 문제 해결. 스폰서(Vercel, Sentry) 기술 동시 활용으로 심사위원 어필.

### 5. Voice-Driven Code Agent (트랙: Multi-Modal + AI App)

음성으로 코딩하는 에이전트 — 자연어로 말하면 코드를 생성하고 Vercel에 배포:
- "로그인 페이지 만들어줘, BetterAuth 써서" → 코드 생성 + Supabase DB 설정 + 배포
- Gemini로 UI 스케치 사진을 찍으면 컴포넌트로 변환
- ElevenLabs로 진행상황을 음성으로 피드백
- 완성된 앱을 Vercel Sandbox에서 실시간 프리뷰
- **왜 이기는가**: 모든 스폰서 기술을 한 프로젝트에 통합. "Zero to Agent"라는 해커톤 테마 자체를 체현. 데모가 극적.

---

## 전략 메모

- **Live Demo 45%가 최대 가중치** → 안정적으로 동작하는 것이 최우선
- **7시간밖에 없음** → 스코프를 작게, 데모를 크게
- **금지 목록 주의** → Basic RAG, Streamlit 절대 금지
- **레포 public 필수** → 처음부터 public repo로 시작
- **스폰서 기술 활용** → Vercel + Gemini는 필수, 추가로 Supabase/ElevenLabs/BetterAuth/Sentry 중 2개 이상 쓰면 유리
