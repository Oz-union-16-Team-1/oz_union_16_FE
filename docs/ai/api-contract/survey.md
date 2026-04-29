# Survey

설문 화면은 최신 API 명세를 기준으로 구현하며, 화면 컴포넌트는 원본 API 필드명에 직접 의존하지 않습니다.
원본 응답과 화면용 상태 사이의 차이는 `adapter/normalizer` 계층에서 정리합니다.

## When To Read

- `src/features/survey`, `src/pages/survey/SurveyPage.tsx` 수정 전에 읽습니다.
- 설문 세션 생성, 메시지 전송, reset 응답 shape가 바뀌면 이 문서를 먼저 갱신합니다.

## Related Code

- `src/features/survey/api`
- `src/features/survey/hooks`
- `src/features/survey/store`
- `src/pages/survey/SurveyPage.tsx`

## 1. Survey Chatbot Endpoints

```text
POST   /api/v1/survey/chatbot/sessions
POST   /api/v1/survey/chatbot/sessions/{session_id}/messages
POST   /api/v1/survey/sessions/reset
```

## 2. Survey Session/Message Response Contract

설문 시작 응답과 답변 전송 응답은 아래 필드를 기준으로 정리합니다.

```json
{
  "session_id": "string",
  "status": "IN_PROGRESS",
  "ai_question": "string",
  "progress": {
    "current_step": 1,
    "total_steps": 4,
    "completion_rate": 0.25
  },
  "recommendation_ready": false
}
```

프론트 화면은 위 raw 응답을 직접 사용하지 않고 아래 규칙으로 정규화합니다.

- `ai_question` -> `assistant_message`
- `progress` -> `SurveyProgress`
- `recommendation_ready` -> 추천 결과 이동 가능 여부
- `status` -> `SurveySessionStatus`

## 3. Survey Reset Contract

설문 초기화는 새 설문 상태를 바로 내려주는 계약으로 사용합니다.

```json
{
  "message": "설문이 초기화되었습니다.",
  "session_id": "string",
  "status": "IN_PROGRESS",
  "ai_question": "string",
  "progress": {
    "current_step": 1,
    "total_steps": 4,
    "completion_rate": 0.0
  },
  "recommendation_ready": false
}
```

프론트는 reset 후 별도 bootstrap 요청을 다시 보내지 않고, reset 응답 자체를 바로 hydrate합니다.

## 4. Adapter Rules

최신 명세를 기준으로 구현하되, 백엔드 응답이 일부 legacy 필드를 반환하더라도 영향 범위가 API adapter에만 머무르도록 아래 fallback을 허용합니다.

- 설문 응답 fallback
  - `chatbot_reply`
  - `progress_rate`
  - `is_completed`

이 fallback은 **화면 컴포넌트에서 직접 사용하지 않고** `src/features/survey/api/survey.ts`의 normalize 함수 안에서만 처리합니다.

## 5. Mock Policy

MSW mock은 실제 API 경로와 응답 구조를 최대한 동일하게 맞춥니다.

- 설문 시작/답변/초기화 경로는 실제 `chatbot` 경로와 동일하게 유지
- 프론트 adapter는 방어적으로 legacy fallback을 유지하지만, mock 응답은 최신 계약을 우선 기준으로 사용
