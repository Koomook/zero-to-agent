# Prompt → Task List 자동 생성 기능 계획

> Phase 3.5 — Dashboard에서 Manager가 자연어 프롬프트로 Task List를 자동 생성

## 개요

현재 Task List는 seed 스크립트로만 생성 가능. 이 기능은 **Manager가 대시보드에서 자연어로 상황을 설명하면 AI가 Task List + Tasks를 자동 생성**하는 것.

## 확정된 기획

| 항목 | 결정 |
|------|------|
| 프롬프트 형태 | 자연어 상황 설명 (예: "50인 해커톤, 음식 테이블 3개...") |
| AI 생성 범위 | `title` + `text_guide`만. `expected_image`는 수동 업로드 |
| 미리보기 편집 | 개별 태스크 삭제 + 수동 추가 가능. 텍스트 인라인 편집은 없음 |
| 확정 플로우 | 프롬프트 → AI 생성 → 미리보기(삭제/추가) → 확정 → DB 저장 |
| 후속 연동 | 확정된 Task List로 "Send Check Now" 바로 실행 가능 |

## User Flow

```
┌─────────────────────────────────────────────┐
│  Dashboard                                  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📝 상황을 설명하세요              │    │
│  │ "50인 해커톤 이벤트입니다.        │    │
│  │  음식 테이블 3개, 음료 코너 1개,  │    │
│  │  굿즈 테이블 1개를 운영합니다."   │    │
│  │                        [생성하기]  │    │
│  └─────────────────────────────────────┘    │
│                    ↓                        │
│  ┌─────────────────────────────────────┐    │
│  │ 🤖 AI 생성 결과 (5개 태스크)      │    │
│  │                                     │    │
│  │ 1. 음식 테이블 A 점검         [✕]  │    │
│  │    피자 트레이 잔량, 냅킨 보충      │    │
│  │ 2. 음식 테이블 B 점검         [✕]  │    │
│  │    샌드위치 보충, 접시 교체         │    │
│  │ 3. 음식 테이블 C 점검         [✕]  │    │
│  │    과일/스낵 잔량, 청결 상태        │    │
│  │ 4. 음료 코너 점검             [✕]  │    │
│  │    음료 잔량, 얼음 보충, 컵 정리    │    │
│  │ 5. 굿즈 테이블 점검           [✕]  │    │
│  │    굿즈 정렬, 재고 확인            │    │
│  │                                     │    │
│  │ [+ 태스크 추가]                     │    │
│  │                                     │    │
│  │ Task List 이름: [해커톤 D-day 점검] │    │
│  │                                     │    │
│  │ [확정]        [재생성]              │    │
│  └─────────────────────────────────────┘    │
│                    ↓                        │
│  기존 Dashboard (Task List + Send Check Now) │
└─────────────────────────────────────────────┘
```

## 상태 머신

```
idle → generating → preview → saving → done
              ↑         │
              └─────────┘ (재생성)
```

## 구현 계획

### 1. API: `POST /api/task-lists/generate` (신규)

**Request:**
```json
{
  "prompt": "50인 해커톤 이벤트입니다. 음식 테이블 3개..."
}
```

**처리:**
1. Gemini 2.5 Flash에 프롬프트 전달
2. Structured output (JSON)으로 태스크 목록 반환 요청
3. 시스템 프롬프트에 Shelf Coach 맥락 포함 (현장 점검용 태스크)

**Response:**
```json
{
  "name": "해커톤 D-day 점검",
  "tasks": [
    { "title": "음식 테이블 A 점검", "text_guide": "피자 트레이 잔량 확인..." },
    { "title": "음료 코너 점검", "text_guide": "음료 잔량, 얼음 보충..." }
  ]
}
```

**Gemini 시스템 프롬프트 핵심:**
- 역할: 현장 운영 어시스턴트
- 출력: JSON (name + tasks 배열)
- 제약: title은 점검 가능한 단위, text_guide는 Staff가 사진으로 보고할 수 있는 구체적 항목

### 2. API: `POST /api/task-lists/confirm` (신규)

**Request:**
```json
{
  "name": "해커톤 D-day 점검",
  "tasks": [
    { "title": "음식 테이블 A 점검", "text_guide": "..." },
    { "title": "음료 코너 점검", "text_guide": "..." }
  ]
}
```

**처리:**
1. `task_lists` 테이블에 INSERT
2. `tasks` 테이블에 각 태스크 INSERT (sort_order 자동 부여)
3. 생성된 task_list_id 반환

**Response:**
```json
{
  "taskList": { "id": "uuid", "name": "해커톤 D-day 점검" },
  "taskCount": 5
}
```

### 3. Dashboard UI 변경 (`src/app/dashboard/page.tsx`)

**추가할 컴포넌트:**

| 컴포넌트 | 역할 |
|----------|------|
| `PromptInput` | 텍스트영역 + "생성하기" 버튼 |
| `TaskPreview` | AI 생성 결과 미리보기 (삭제/추가/재생성/확정) |
| `AddTaskModal` | 수동 태스크 추가 시 title + text_guide 입력 |

**UI 위치:** 기존 대시보드 상단, Task List 섹션 위에 배치

### 4. 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `src/app/api/task-lists/generate/route.ts` | **신규** — AI 태스크 생성 API |
| `src/app/api/task-lists/confirm/route.ts` | **신규** — 확정 → DB 저장 API |
| `src/lib/gemini.ts` | **수정** — `generateTaskList(prompt)` 함수 추가 |
| `src/app/dashboard/page.tsx` | **수정** — PromptInput + TaskPreview UI 추가 |
| `src/lib/types.ts` | **수정** — `GeneratedTask`, `GeneratedTaskList` 타입 추가 |

### 5. 구현 순서

```
Step 1: types.ts에 GeneratedTask/GeneratedTaskList 타입 추가
Step 2: gemini.ts에 generateTaskList() 함수 구현
Step 3: /api/task-lists/generate API 구현
Step 4: /api/task-lists/confirm API 구현
Step 5: Dashboard UI — PromptInput 컴포넌트
Step 6: Dashboard UI — TaskPreview 컴포넌트 (삭제/추가)
Step 7: 통합 테스트 — 프롬프트→생성→편집→확정→Send Check Now
```

## 기술 결정

- **AI 모델**: Gemini 2.5 Flash (기존과 동일, 텍스트 생성에 최적)
- **Structured Output**: `@ai-sdk/google`의 `generateObject()` 사용 → JSON schema로 타입 안전하게
- **State 관리**: React useState로 클라이언트 사이드 (DB 저장 전까지는 임시 상태)
- **에러 처리**: AI 생성 실패 시 "재시도" 버튼 표시, 네트워크 에러 토스트

## 예상 작업량

- API 2개 + gemini 함수 1개 + Dashboard UI 변경 = 약 5개 파일
- 기존 코드 패턴(Gemini, Supabase, Dashboard) 재활용 → 신규 패턴 최소화
