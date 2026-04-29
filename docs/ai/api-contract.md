# API Contract Notes

이 문서는 프론트 구현 중 API 명세와 요구사항 정의서가 흔들리는 부분을 한 곳에 모아두기 위한 임시 계약 문서입니다.
백엔드 답변이 확정되면 이 문서를 먼저 갱신한 뒤 구현 코드를 맞춥니다.

## Auth and Session

인증 관련 플로우와 토큰 관리 정책은 아래 내용을 기준으로 합니다.

### 1. 토큰 저장 및 관리 전략

- **Access Token**: 클라이언트 메모리(Zustand State) 내에서 관리하여 XSS 공격 방어.
- **Refresh Token**: 브라우저 **HttpOnly, Secure 쿠키** 기반으로 관리하여 보안 강화. 쿠키는 프론트 도메인이 아니라 **백엔드 API 도메인** 아래 저장되는 것을 기준으로 확인합니다.
- **Startup Bootstrap**: 앱 최초 진입 시 `POST /api/v1/accounts/token/refresh`로 세션 복구를 시도하고, 성공 시 `/me` 조회로 사용자 정보를 hydrate함.
- **Legacy Cleanup**: 기존 `localStorage` 인증 키(`auth-storage`, `access_token`, `refresh_token` 등)는 앱 시작 시 1회 정리함.

#### 운영 Origin 기준

- **Frontend Origin**: `https://oz-union-16-fe.vercel.app`
- **Backend API Origin**: `https://oz-pgti.duckdns.org`
- **DevTools Cookie 확인 위치**: `Application > Cookies > https://oz-pgti.duckdns.org`
- 프론트의 `VITE_API_BASE_URL`과 소셜 로그인 시작 URL/refresh URL은 위 백엔드 Origin 기준으로 정렬합니다.
- 운영에서 `Set-Cookie`는 보이는데 쿠키가 안 남는 경우, 먼저 **요청 host가 실제로 `oz-pgti.duckdns.org`인지**부터 확인합니다.

### 2. 인증 관련 API 엔드포인트

- **소셜 로그인 진입**: `GET /api/v1/accounts/social-login/{google|kakao|naver}` (백엔드 제공 OAuth 시작점)
- **소셜 로그인 콜백 경로**: 정식 경로는 `/callback`이며, 기존 `/auth/callback`은 하위 호환 redirect 경로로 유지함.
- **토큰 갱신**: `POST /api/v1/accounts/token/refresh` (쿠키의 리프레시 토큰을 사용하여 액세스 토큰 재발급)
- **주의**: API 명세서 표에 `refresh_token` body 예시가 있어도, 실서버 동작 기준은 HttpOnly 쿠키 인증이며 프론트는 `withCredentials` 요청으로 맞춥니다.
- **로그아웃**: `POST /api/v1/accounts/logout` (액세스 토큰 무효화 및 서버측 쿠키 삭제 요청)
- **비밀번호 변경**: `POST /api/v1/accounts/me/change-password`
- **회원 탈퇴**: `DELETE /api/v1/accounts/me` (request body에 `password` 포함)
- **마이페이지 찜 목록 조회**: `GET /api/v1/accounts/me/game-like`
- **마이페이지 찜 해제**: `DELETE /api/v1/accounts/me/game-like/{game_id}`
- **게임 좋아요 등록/해제**: `POST/DELETE /api/v1/games/{game_id}/like`

#### 비밀번호 변경 필드 계약

비밀번호 변경은 현재 프론트 구현 기준으로 아래 필드명을 canonical contract로 사용합니다.
백엔드 명세가 다시 조정되더라도, 프론트는 이 문서를 먼저 갱신한 뒤 타입과 mock을 함께 수정합니다.

```json
{
  "old_password": "string",
  "new_password": "string",
  "new_password_check": "string"
}
```

- `old_password`: 현재 비밀번호
- `new_password`: 새 비밀번호
- `new_password_check`: 새 비밀번호 확인
- 필드 검증 에러는 `detail` 또는 `error_detail` 안에 위 3개 키로 내려오는 것을 기준으로 처리합니다.
- 현재 비밀번호 불일치는 field error가 아니라 일반 에러 메시지로 처리하며, 응답 예시는 아래와 같습니다.

```json
{
  "error_detail": "현재 비밀번호가 올바르지 않습니다."
}
```

- 성공 응답은 아래 형태를 기준으로 사용합니다.

```json
{
  "detail": "비밀번호가 변경되었습니다."
}
```

### 3. 로그아웃 및 세션 초기화 규정

- **상태 초기화**: 로그아웃 실행 시 `useAuthStore`의 토큰 및 사용자 프로필 정보를 즉시 `null`로 초기화.
- **데이터 정리**: `localStorage`에 남아 있는 모든 인증 관련 레거시 데이터를 명시적으로 삭제.
- **UI/UX**: 로그아웃 후 즉시 메인 페이지(`/`)로 리다이렉트하며, 헤더를 비로그인 상태로 갱신.

### 4. 인증 에러(401) 처리 로직

- **Axios Interceptor**: 모든 API 요청에서 `401 Unauthorized` 발생 시 `/token/refresh`를 자동 호출하여 세션 연장 시도.
- **세션 만료 처리**: 리프레시 토큰 만료로 갱신 실패 시, '세션 만료' 안내 후 강제 로그아웃 및 로그인 페이지로 유도.
- **초기 진입 예외 처리**: 콜백 라우트(`/callback`, `/auth/callback`)에서는 중복 refresh를 피하기 위해 앱 시작 bootstrap을 건너뜀.

#### 배포 CORS / Cookie 전제 조건

- `Access-Control-Allow-Origin`은 반드시 `https://oz-union-16-fe.vercel.app`와 정확히 일치해야 합니다.
- `Access-Control-Allow-Credentials: true`가 포함되어야 합니다.
- `Access-Control-Allow-Origin: *`는 credentials 요청과 함께 사용할 수 없습니다.
- refresh 쿠키는 `SameSite=None; Secure; HttpOnly`를 전제로 하며, 프론트와 백엔드는 모두 `https:` 환경이어야 합니다.
- 브라우저 런타임 코드에서는 `Set-Cookie` 응답 헤더와 실제 `Cookie` 요청 헤더 원문을 읽을 수 없으므로, 배포 검증은 DevTools와 DEV 진단 로그를 함께 사용합니다.

### 5. 마이페이지 프로필 표시 필드

- `GET /api/v1/accounts/me` 응답은 최소 `nickname`, `name`, `gender`, `email`을 포함한다고 가정합니다.
- 프론트 마이페이지 상단 프로필 영역은 위 4개 필드를 우선 노출하고, 누락 값은 `N/A`로 처리합니다.

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

#### Mock liked-state source of truth

- 좋아요 mock의 canonical source-of-truth 는 `src/features/auth/mocks/handlers.ts` 의 사용자별 liked map과 game like-count map입니다.
- `GET /api/v1/accounts/me/game-like`, `POST/DELETE /api/v1/games/{game_id}/like`, 추천/매칭/게임 상세 mock 은 모두 이 상태를 기준으로 동작합니다.
- 이 상태는 **브라우저 메모리 기반**이므로 SPA 내부 이동에서는 유지되지만, **전체 페이지 리로드나 직접 URL 진입 시 초기화**됩니다.
- 현재 mock 계층은 `sessionStorage`/`localStorage` persistence를 사용하지 않습니다. 리로드 이후 영속 상태가 필요하면 별도 요구사항으로 추가합니다.

### 7. Recommendation Detail Modal Integration

추천 결과 리스트에서는 `game_id`가 있는 item만 상세 모달 진입이 가능합니다.

- 상세 모달은 공용 `GameDetailModal`을 재사용
- 상세 데이터 조회는 `getGameDetail(gameId)` 경계를 사용
- 모달을 닫아도 추천 리스트 스크롤 위치와 현재 결과 상태는 유지

### 8. Matching Like State Rules

- `GET /api/v1/match/candidates` 의 `is_liked` 는 정적 seed 값이 아니라 **현재 로그인 사용자의 찜 상태**를 기준으로 계산합니다.
- 매칭 화면의 하트 클릭은 게임 공통 좋아요 API(`POST/DELETE /api/v1/games/{game_id}/like`)를 그대로 사용합니다.
- 매칭 화면은 좋아요를 별도 로컬 상태로 복제하지 않고, 공통 좋아요 cache/source-of-truth 를 따릅니다.
- 매칭 제출 시 mock liked 상태를 동기화할 때 `is_liked` 뿐 아니라 `like_count` 도 기존 좋아요 API와 같은 규칙으로 함께 맞춥니다.

### 9. Out of Scope / Follow-up Notes

- 추천 리스트 row의 찜 버튼 API 연결은 별도 작업 범위로 유지
- 문서가 갱신되면 구현 코드는 이 문서를 우선 기준으로 맞추고, 명세 변경 시 adapter 계층을 먼저 수정합니다

## Customer Support Chatbot

고객센터 챗봇 관련 명세는 아래와 같습니다.

### API Endpoints

```text
POST   /api/v1/chatbot/messages     # 메시지 전송 (세션 생성/재사용)
GET    /api/v1/chatbot/stream       # AI 응답 스트리밍 (SSE, query: session_id)
```

### Integration Details

- **Widget**: `SupportChatWidget`을 통해 전역 레이아웃(`App.tsx`)에 배치.
- **Mocking**: 백엔드 미완성 시 MSW를 통해 스트리밍 응답 시뮬레이션.
- **State**: `useSupportChatStore`를 통한 대화 내역 및 위젯 상태 관리.
- **Boundary**: 고객센터 챗봇 API(`/api/v1/chatbot/*`)는 설문 챗봇 API(`/api/v1/survey/chatbot/*`)와 별개로 운영하며, 경로를 혼용하지 않습니다.

## Games

게임 목록/상세/좋아요 관련 명세는 최신 Swagger를 canonical contract로 사용합니다.
화면 컴포넌트는 raw API 필드명에 직접 의존하지 않고, `src/features/games/gameApi.ts`의 normalize 경계에서 화면용 타입으로 변환합니다.

### API Endpoints

```text
GET    /api/v1/games/list/top100
GET    /api/v1/games/list/{game_id}
POST   /api/v1/games/{game_id}/like
DELETE /api/v1/games/{game_id}/like
```

### 1. 인기 TOP 100 / 검색 목록 Contract

인기 목록과 검색은 같은 엔드포인트를 사용하며, query parameter 조합으로 동작합니다.

```json
{
  "ranked_at": "2026-04-08T20:10:00+09:00",
  "count": 100,
  "next": 2,
  "results": [
    {
      "game_id": 1942,
      "name": "Example Game",
      "genres": ["전략", "시뮬레이션"],
      "thumbnail_url": "https://cdn.example.com/1942.jpg",
      "rating": 88.4,
      "is_liked": false,
      "like_count": 123
    }
  ]
}
```

- canonical query params: `genre_id`, `page`, `page_size`, `search`, `fuzzy`
- `next` 는 다음 페이지 번호를 의미하는 `number | null` 입니다. 게임 목록은 URL 문자열을 canonical contract로 사용하지 않습니다.
- 프론트 검색 pagination은 `next` 숫자를 우선 사용하고, 서버가 `next`를 비워 보낼 때만 `count` 기반 fallback 계산을 허용합니다.
- 화면용 목록 타입은 아래 기준으로 정규화합니다.
  - `game_id` -> `gameId`
  - `name` -> `name`
  - `thumbnail_url` -> `thumbnailUrl`
  - `is_liked` -> `isLiked`
  - `like_count` -> `likeCount`
- 누락 텍스트/배열은 기존 규칙대로 `N/A` 또는 `null` 기반으로 정규화합니다.

### 2. 게임 상세 Contract

```json
{
  "game_id": 501,
  "title": "엘든 링: 황금 나무의 그림자",
  "genres": ["액션", "역할수행(RPG)"],
  "release_date": "2024-06-21",
  "developer": "FromSoftware",
  "publisher": "Bandai Namco",
  "media": {
    "promo_video_url": "https://www.youtube.com/watch?v=example",
    "promo_embed_url": "https://www.youtube.com/embed/example",
    "cover_image_url": "https://images.igdb.com/igdb/image/upload/t_1080p/co1234.jpg"
  },
  "description": "그림자의 땅에서 펼쳐지는 새로운 모험과 강력한 보스들과의 전투.",
  "external_links": {
    "official_site": "https://www.eldenring.com",
    "steam": "https://store.steampowered.com/app/eldenring",
    "epic_store": null
  },
  "is_liked": false,
  "like_count": 1250
}
```

- 상세 응답의 `media`, `external_links`, `is_liked`, `like_count` 는 Swagger schema를 우선 기준으로 사용합니다.
- 다만 프론트는 실서버의 nullable/누락 가능성에 대비해 normalize 단계에서만 방어하고, 컴포넌트에는 정규화된 `GameDetail` 타입만 전달합니다.
- 상세 누락 필드는 기존 UX 규칙대로 `N/A` 또는 `null` 로 표시합니다.

### 3. 게임 좋아요 Contract

```json
{
  "game_id": 501,
  "like_count": 1251
}
```

- 좋아요 등록은 `POST`, 취소는 `DELETE /api/v1/games/{game_id}/like` 를 사용합니다.
- 응답 본문은 `game_id`, `like_count` 만 canonical field로 보고, 현재 좋아요 여부는 요청 의도에 따라 프론트에서 `isLiked` 를 합성합니다.
- 좋아요 반영은 목록/상세/추천/매칭/마이페이지 찜 목록 cache를 공통 query sync 경계에서 함께 갱신합니다.

---

_(이하 기존 게임 목록/상세 API 명세 생략 가능하나 문서 무결성을 위해 유지 권장)_
