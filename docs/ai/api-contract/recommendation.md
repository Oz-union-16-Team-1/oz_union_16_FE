# Recommendation and Matching

추천 결과 화면은 최신 API 명세를 기준으로 구현하며, 화면 컴포넌트는 원본 API 필드명에 직접 의존하지 않습니다.
원본 응답과 화면용 상태 사이의 차이는 `adapter/normalizer` 계층에서 정리합니다.

## When To Read

- `src/features/recommendation`, `src/features/matching`, `src/pages/recommendation`, `src/pages/matching` 수정 전에 읽습니다.
- 추천 결과 pagination, 매칭 결과 liked-state, 추천 리스트 상세 모달 연동을 바꿀 때 이 문서를 먼저 갱신합니다.

## Related Code

- `src/features/recommendation/hooks`
- `src/features/recommendation/utils`
- `src/features/matching/api`
- `src/features/matching/mocks`
- `src/pages/recommendation/RecommendationListPage.tsx`
- `src/pages/matching/MatchingGenreDetailPage.tsx`

## 1. Recommendation Result Endpoint

```text
GET    /api/v1/survey/result
```

## 2. Recommendation Result Contract

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

## 3. Adapter Rules

최신 명세를 기준으로 구현하되, 백엔드 응답이 일부 legacy 필드를 반환하더라도 영향 범위가 API adapter에만 머무르도록 아래 fallback을 허용합니다.

- 추천 결과 fallback
  - `name` -> `title`

이 fallback은 **화면 컴포넌트에서 직접 사용하지 않고** normalize 함수 안에서만 처리합니다.

## 4. Mock Policy

MSW mock은 실제 API 경로와 응답 구조를 최대한 동일하게 맞춥니다.

- 추천 결과 item은 mock에서도 `title` 기준으로 반환
- 추천 결과 mock도 `더보기` 버튼 정책과 동일하게 `5개 단위 + next 기반` 구조를 유지
- 프론트 adapter는 방어적으로 legacy fallback을 유지하지만, mock 응답은 최신 계약을 우선 기준으로 사용

### Mock liked-state source of truth

- 좋아요 mock의 canonical source-of-truth 는 `src/features/auth/mocks/handlers.ts` 의 사용자별 liked map과 game like-count map입니다.
- `GET /api/v1/accounts/me/game-like`, `POST/DELETE /api/v1/games/{game_id}/like`, 추천/매칭/게임 상세 mock 은 모두 이 상태를 기준으로 동작합니다.
- 이 상태는 **브라우저 메모리 기반**이므로 SPA 내부 이동에서는 유지되지만, **전체 페이지 리로드나 직접 URL 진입 시 초기화**됩니다.
- 현재 mock 계층은 `sessionStorage`/`localStorage` persistence를 사용하지 않습니다. 리로드 이후 영속 상태가 필요하면 별도 요구사항으로 추가합니다.

## 5. Recommendation Detail Modal Integration

추천 결과 리스트에서는 `game_id`가 있는 item만 상세 모달 진입이 가능합니다.

- 상세 모달은 공용 `GameDetailModal`을 재사용
- 상세 데이터 조회는 `getGameDetail(gameId)` 경계를 사용
- 모달을 닫아도 추천 리스트 스크롤 위치와 현재 결과 상태는 유지

## 6. Matching Like State Rules

- `GET /api/v1/match/candidates` 의 `is_liked` 는 정적 seed 값이 아니라 **현재 로그인 사용자의 찜 상태**를 기준으로 계산합니다.
- 매칭 화면의 하트 클릭은 게임 공통 좋아요 API(`POST/DELETE /api/v1/games/{game_id}/like`)를 그대로 사용합니다.
- 매칭 화면은 좋아요를 별도 로컬 상태로 복제하지 않고, 공통 좋아요 cache/source-of-truth 를 따릅니다.
- 매칭 제출 시 mock liked 상태를 동기화할 때 `is_liked` 뿐 아니라 `like_count` 도 기존 좋아요 API와 같은 규칙으로 함께 맞춥니다.

## 7. Out of Scope / Follow-up Notes

- 추천 리스트 row의 찜 버튼 API 연결은 별도 작업 범위로 유지
- 문서가 갱신되면 구현 코드는 관련 계약 문서를 우선 기준으로 맞추고, 명세 변경 시 adapter 계층을 먼저 수정합니다
