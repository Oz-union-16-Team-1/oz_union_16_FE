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
  promoEmbedUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  platforms: Array<{ name: string }>;
  externalLinks: {
    officialSite?: string | null;
    steam?: string | null;
    epicStore?: string | null;
  };
  likeCount: number;
  isLiked: boolean | null;
};
```

백엔드 원본 응답에서 데이터가 없는 값은 `"N/A"` 문자열이 아니라 `null`로 받는 것을 기준으로 합니다.
화면의 `N/A` 표기는 컴포넌트 또는 정규화 이후 표시 계층에서 처리합니다.

`like_count`는 원본 응답에서 `null`일 수 있고, 프론트 정규화 이후에는 `0`으로 사용합니다.
`is_liked`는 로그인 유저 기준 `true | false`, 비로그인 기준 `null`로 처리합니다.
`promo_embed_url`은 iframe 연결을 위한 필드로 타입과 정규화까지만 반영하고, 실제 iframe 렌더링은 후속 작업에서 처리합니다.

상세 조회가 `404 Not Found`를 반환하면 상세 모달 안에서 아래 빈 상태를 표시합니다.

```text
해당 게임 상세 정보를 찾을 수 없습니다.
```

## Like Response Shape

좋아요 등록/취소 응답은 화면에서 아래 형태로 정규화해서 사용합니다.

```ts
type GameLikeResponse = {
  gameId: number;
  isLiked: boolean;
  likeCount: number;
};
```

백엔드 원본 응답은 아래 필드를 내려주는 것을 기준으로 합니다.

```json
{
  "game_id": 501,
  "is_liked": true,
  "like_count": 1251
}
```

상세 모달은 좋아요 등록/취소 이후 별도 재조회 없이 이 응답의 `is_liked`, `like_count`로 UI를 갱신합니다.
비로그인 상태에서는 좋아요 API를 호출하지 않고 로그인 안내 문구를 표시합니다.

## Contract Notes and Uncertainties

- `GET /api/v1/games/list/top100`과 `GET /api/v1/games/list`는 선택 장르가 있을 때 `genre_id`를 전달합니다.
- `genre_id`는 1~14 범위를 사용하고, 전체 조회는 `genre_id`를 보내지 않습니다. 유효하지 않은 값은 `400 Bad Request`로 처리합니다.
- 상세 응답 필드명은 `title`, 목록 응답 필드명은 `name`으로 다릅니다.
- 좋아요 상태는 상세 응답의 `is_liked`를 우선 사용합니다. 별도 `like-status` API는 상태 재검증이 필요할 때만 사용합니다.
- 상세 미디어 응답의 `promo_video_url`은 원본 영상 URL, `promo_embed_url`은 iframe용 URL로 구분합니다.

정렬 기준은 새 요구사항 정의서 기준으로 평점순/최신순이며, API 명세의 `rating_desc`/`created_at`과 의미가 맞습니다.

## Temporary Frontend Defaults

- 초기 장르 필터는 `전체`로 표시합니다.
- TOP 100과 일반 검색 목록의 전체 조회는 `genre_id`를 보내지 않고, 장르 선택 시 명세의 장르 ID를 전달합니다.
- 일반 검색 목록은 `search`, `fuzzy`, `sort`, `page`, `page_size`를 유지하고, 장르 선택 시 `genre_id`를 함께 전달합니다.
- API URL과 응답 필드명은 컴포넌트 내부가 아니라 API 모듈에서만 다룹니다.
