# API Contract Notes

이 문서는 프론트 구현 중 API 명세와 요구사항 정의서가 흔들리는 부분을 한 곳에 모아두기 위한 임시 계약 문서입니다.
백엔드 답변이 확정되면 이 문서를 먼저 갱신한 뒤 구현 코드를 맞춥니다.

## Auth and Session

인증 관련 플로우와 토큰 관리 정책은 아래 내용을 기준으로 합니다.

### 1. 토큰 저장 및 관리 전략

- **Access Token**: 클라이언트 메모리(Zustand State) 내에서 관리하여 XSS 공격 방어.
- **Refresh Token**: 브라우저 **HttpOnly, Secure 쿠키** 기반으로 관리하여 보안 강화.
- **Legacy Cleanup**: 기존 `localStorage`에 `refresh_token`을 저장하던 방식은 완전히 폐기하며, 관련 데이터를 일괄 삭제함.

### 2. 인증 관련 API 엔드포인트

- **소셜 로그인 진입**: `GET /api/v1/accounts/login/{google|kakao|naver}` (백엔드 제공 OAuth 시작점)
- **토큰 갱신**: `POST /api/v1/accounts/token/refresh` (쿠키의 리프레시 토큰을 사용하여 액세스 토큰 재발급)
- **로그아웃**: `POST /api/v1/accounts/logout` (액세스 토큰 무효화 및 서버측 쿠키 삭제 요청)

### 3. 로그아웃 및 세션 초기화 규정

- **상태 초기화**: 로그아웃 실행 시 `useAuthStore`의 토큰 및 사용자 프로필 정보를 즉시 `null`로 초기화.
- **데이터 정리**: `localStorage`에 남아 있는 모든 인증 관련 레거시 데이터를 명시적으로 삭제.
- **UI/UX**: 로그아웃 후 즉시 메인 페이지(`/`)로 리다이렉트하며, 헤더를 비로그인 상태로 갱신.

### 4. 인증 에러(401) 처리 로직

- **Axios Interceptor**: 모든 API 요청에서 `401 Unauthorized` 발생 시 `/token/refresh`를 자동 호출하여 세션 연장 시도.
- **세션 만료 처리**: 리프레시 토큰 만료로 갱신 실패 시, '세션 만료' 안내 후 강제 로그아웃 및 로그인 페이지로 유도.

## Survey and Recommendation

설문 및 추천 결과 화면은 최신 API 명세서 `(3)`를 기준으로 구현하며, 화면 컴포넌트는 원본 API 필드명에 직접 의존하지 않습니다.
원본 응답과 화면용 상태 사이의 차이는 `adapter/normalizer` 계층에서 정리합니다.

### 1. Survey Chatbot Endpoints

```text
POST   /api/v1/survey/chatbot/sessions
POST   /api/v1/survey/chatbot/sessions/{session_id}/messages
POST   /api/v1/survey/sessions/reset
GET    /api/v1/survey/result
```

### 2. Survey Session/Message Response Contract

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

### 3. Survey Reset Contract

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

### 4. Recommendation Result Contract

설문 완료 후 추천 결과는 아래 응답을 기준으로 렌더링합니다.

```json
{
  "session_id": "string",
  "user_id": 1,
  "count": 15,
  "next": "5",
  "results": [
    {
      "game_id": 101,
      "title": "Elden Ring",
      "genres": ["Action", "RPG"],
      "thumbnail_url": "https://...",
      "rating": 4.9,
      "is_liked": false
    }
  ]
}
```

추천 결과 리스트 화면은 아래 필드를 기준으로 동작합니다.

- 설문 추천 결과와 매칭 추천 결과는 같은 리스트 화면에서 동일한 UX로 노출합니다.
- 로딩 방식은 **무한 스크롤이 아니라 `더보기` 버튼 방식**으로 고정합니다.
- 프론트 기본 조회 단위는 `5개`이며, `next`가 있으면 `더보기` 클릭 시 다음 결과를 추가 조회합니다.
- `next === null`이면 더보기 버튼을 노출하지 않고 추가 조회를 종료합니다.

- `game_id`: 상세 모달 연결 키
- `title`: 게임명 표기 기준
- `genres`: 태그/하이라이트 계산
- `thumbnail_url`: 리스트 썸네일
- `rating`: 평점 표시
- `is_liked`: 현재 찜 상태 표시
- `count`, `next`: 더보기 버튼 기반 추가 조회 기준

### 5. Adapter Rules

최신 명세를 기준으로 구현하되, 백엔드 응답이 일부 legacy 필드를 반환하더라도 영향 범위가 API adapter에만 머무르도록 아래 fallback을 허용합니다.

- 설문 응답 fallback
  - `chatbot_reply`
  - `progress_rate`
  - `is_completed`
- 추천 결과 fallback
  - `name` -> `title`

이 fallback은 **화면 컴포넌트에서 직접 사용하지 않고** `src/features/survey/api/survey.ts`의 normalize 함수 안에서만 처리합니다.

### 6. Mock Policy

MSW mock은 실제 API 경로와 응답 구조를 최대한 동일하게 맞춥니다.

- 설문 시작/답변/초기화 경로는 실제 `chatbot` 경로와 동일하게 유지
- 추천 결과 item은 mock에서도 `title` 기준으로 반환
- 추천 결과 mock도 `더보기` 버튼 정책과 동일하게 `5개 단위 + next 기반` 구조를 유지
- 프론트 adapter는 방어적으로 legacy fallback을 유지하지만, mock 응답은 최신 계약을 우선 기준으로 사용

### 7. Recommendation Detail Modal Integration

추천 결과 리스트에서는 `game_id`가 있는 item만 상세 모달 진입이 가능합니다.

- 상세 모달은 공용 `GameDetailModal`을 재사용
- 상세 데이터 조회는 `getGameDetail(gameId)` 경계를 사용
- 모달을 닫아도 추천 리스트 스크롤 위치와 현재 결과 상태는 유지

### 8. Out of Scope / Follow-up Notes

- 추천 리스트 row의 찜 버튼 API 연결은 별도 작업 범위로 유지
- 매칭 후보 조회 응답은 최신 명세서와 현재 프론트 구조 차이가 있어, 추후 매칭 adapter 정리 PR에서 별도 동기화 필요
- 문서가 갱신되면 구현 코드는 이 문서를 우선 기준으로 맞추고, 명세 변경 시 adapter 계층을 먼저 수정합니다

## Customer Support Chatbot

고객센터 챗봇 관련 명세는 아래와 같습니다.

### API Endpoints

```text
POST   /api/v1/support/chat/send    # 메시지 전송 및 AI 응답 (Streaming)
GET    /api/v1/support/faq          # 자주 묻는 질문 목록 조회
```

### Integration Details

- **Widget**: `SupportChatWidget`을 통해 전역 레이아웃(`App.tsx`)에 배치.
- **Mocking**: 백엔드 미완성 시 MSW를 통해 스트리밍 응답 시뮬레이션.
- **State**: `useSupportChatStore`를 통한 대화 내역 및 위젯 상태 관리.

---

_(이하 기존 게임 목록/상세 API 명세 생략 가능하나 문서 무결성을 위해 유지 권장)_
