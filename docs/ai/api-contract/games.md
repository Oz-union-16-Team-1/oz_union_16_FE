# Games

게임 목록/상세/좋아요 관련 명세는 최신 Swagger를 canonical contract로 사용합니다.
화면 컴포넌트는 raw API 필드명에 직접 의존하지 않고, `src/features/games/gameApi.ts`의 normalize 경계에서 화면용 타입으로 변환합니다.

## When To Read

- `src/features/games`, `src/pages/main`, 추천/매칭의 게임 좋아요 연동을 수정하기 전에 읽습니다.
- 게임 목록/상세/좋아요 endpoint, pagination 정책, mock 응답 shape를 바꿀 때 이 문서를 먼저 갱신합니다.

## Related Code

- `src/features/games`
- `src/pages/main/hooks/useMainPageGames.ts`
- `src/pages/main/components/MainGameCarousel.tsx`
- `src/features/recommendation/hooks/useRecommendationLike.ts`
- `src/pages/matching/MatchingGenreDetailPage.tsx`

## API Endpoints

```text
GET    /api/v1/games/list/top100
GET    /api/v1/games/list/{game_id}
POST   /api/v1/games/{game_id}/like
DELETE /api/v1/games/{game_id}/like
```

## 1. 인기 TOP 100 / 검색 목록 Contract

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

## 2. 게임 상세 Contract

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

## 3. 게임 좋아요 Contract

```json
{
  "game_id": 501,
  "like_count": 1251
}
```

- 좋아요 등록은 `POST`, 취소는 `DELETE /api/v1/games/{game_id}/like` 를 사용합니다.
- 응답 본문은 `game_id`, `like_count` 만 canonical field로 보고, 현재 좋아요 여부는 요청 의도에 따라 프론트에서 `isLiked` 를 합성합니다.
- 좋아요 반영은 목록/상세/추천/매칭/마이페이지 찜 목록 cache를 공통 query sync 경계에서 함께 갱신합니다.
