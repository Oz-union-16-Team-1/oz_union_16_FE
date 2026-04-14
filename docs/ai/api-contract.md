# API Contract Notes

이 문서는 프론트 구현 중 API 명세와 요구사항 정의서가 흔들리는 부분을 한 곳에 모아두기 위한 임시 계약 문서입니다.
백엔드 답변이 확정되면 이 문서를 먼저 갱신한 뒤 구현 코드를 맞춥니다.

## Main and Detail APIs

메인/상세 페이지에서 직접 사용하는 API 후보는 아래와 같습니다.

```text
GET    /api/v1/games/list/top100
GET    /api/v1/games/list
GET    /api/v1/games/list/{game_id}
POST   /api/v1/games/{game_id}/like
DELETE /api/v1/games/{game_id}/like
GET    /api/v1/games/{game_id}/like-status
```

매칭 담당자가 참고할 API:

```text
GET    /api/v1/match/candidates
```

## List Response Shape

목록 응답은 화면에서 아래 형태로 정규화해서 사용합니다.

```ts
type GameListItem = {
  gameId: number;
  name: string;
  genres: string[];
  thumbnailUrl: string | null;
  rating: number | null;
  isLiked?: boolean;
};
```

명세상 TOP 100 응답에는 `ranked_at`과 `results`가 있고, 일반 목록 응답에는 `count`와 `results`가 있습니다.
화면 컴포넌트는 원본 응답을 직접 받지 말고 정규화된 `GameListItem`을 받게 합니다.

## Detail Response Shape

상세 응답은 화면에서 아래 형태로 정규화해서 사용합니다.

```ts
type GameDetail = {
  gameId: number;
  title: string;
  genres: string[];
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  promoVideoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  platforms: Array<{ name: string; iconUrl: string | null }>;
  externalLinks: {
    officialSite?: string | null;
    steam?: string | null;
    epicStore?: string | null;
  };
  likeCount: number;
  isLiked: boolean | null;
};
```

명세의 상세 응답에는 `create_date`와 예시의 `created_date`처럼 표기 차이가 있습니다.
화면에서는 해당 값을 직접 사용하지 말고, 필요해지면 API 정규화 함수에서 처리합니다.

## Known Uncertainties

- `GET /api/v1/games/list`에는 요구사항상 장르 필터가 필요하지만 현재 명세에는 장르 파라미터가 없습니다.
- `GET /api/v1/games/list/top100`은 `genre_id`가 비어 있거나 유효 범위를 벗어나면 전체 조회로 처리됩니다. 일반 목록 API에도 같은 규칙이 적용되는지는 확정되지 않았습니다.
- 상세 응답 필드명은 `title`, 목록 응답 필드명은 `name`으로 다릅니다.
- 좋아요 상태는 상세 응답의 `is_liked`와 별도 `like-status` API가 함께 존재합니다. 상세 조회 응답을 우선 사용하고, 백엔드 정책이 바뀌면 별도 조회로 전환합니다.

정렬 기준은 새 요구사항 정의서 기준으로 평점순/최신순이며, API 명세의 `rating_desc`/`created_at`과 의미가 맞습니다.

## Temporary Frontend Defaults

- 초기 장르 필터는 `전체`로 표시합니다.
- TOP 100 전체 조회는 `genre_id`를 보내지 않는 방식으로 우선 구현하고, 장르 선택 시 명세의 장르 ID를 전달합니다.
- 일반 검색 목록은 백엔드 확정 전까지 `search`, `fuzzy`, `sort`, `page`, `page_size`만 사용합니다.
- API URL과 응답 필드명은 컴포넌트 내부가 아니라 API 모듈에서만 다룹니다.
