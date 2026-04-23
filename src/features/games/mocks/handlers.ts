import { delay, http, HttpResponse } from 'msw';

import { getMockGameLikeStateForAuthorization } from '../../auth/mocks/handlers';
import { GAME_GENRE_ID_MAP } from '../genres';
import {
  getStoredGameDetail,
  getStoredTop100Games,
  searchStoredGames,
} from './state';
import type {
  GameDetail,
  GameListItem,
  RawGameDetailResponse,
  RawGameListItem,
} from '../types';

const DEFAULT_GAME_PAGE_SIZE = 20;
const DEFAULT_GAME_SORT = 'rating_desc';
const VALID_GAME_SORT_VALUES = new Set([
  'rating_desc',
  'like_desc',
  'created_at',
]);
const validGenreIds = new Set(Object.values(GAME_GENRE_ID_MAP));

const getErrorResponse = (status: number, message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status },
  );

const parsePositiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number(value ?? fallback);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseGenreId = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const toRawGameListItem = (game: GameListItem): RawGameListItem => ({
  game_id: game.gameId,
  name: game.name,
  genres: game.genres,
  thumbnail_url: game.thumbnailUrl,
  rating: game.rating,
  is_liked: game.isLiked ?? null,
});

const toRawGameDetail = (detail: GameDetail): RawGameDetailResponse => ({
  game_id: detail.gameId,
  title: detail.title,
  genres: detail.genres,
  release_date: detail.releaseDate,
  developer: detail.developer,
  publisher: detail.publisher,
  media: {
    promo_video_url: detail.promoVideoUrl,
    promo_embed_url: detail.promoEmbedUrl,
    cover_image_url: detail.coverImageUrl,
  },
  description: detail.description,
  external_links: {
    official_site: detail.externalLinks.officialSite ?? null,
    steam: detail.externalLinks.steam ?? null,
    epic_store: detail.externalLinks.epicStore ?? null,
  },
  like_count: detail.likeCount,
  is_liked: detail.isLiked,
});

export const gamesHandlers = [
  http.get('/api/v1/games/list/top100', async ({ request }) => {
    const url = new URL(request.url);
    const genreIdValue = url.searchParams.get('genre_id');
    const genreId = parseGenreId(url.searchParams.get('genre_id'));
    const resolveStoredGameLikeState = (
      gameId: number,
      fallback: { isLiked: boolean | null; likeCount: number },
    ) => {
      const likeState = getMockGameLikeStateForAuthorization(
        request.headers.get('authorization'),
        gameId,
        fallback.likeCount,
      );

      return {
        isLiked: likeState.is_liked,
        likeCount: likeState.like_count,
      };
    };

    if (genreIdValue && (!genreId || !validGenreIds.has(genreId))) {
      return getErrorResponse(400, '유효하지 않은 genre_id 입니다. (1~14)');
    }

    const games = getStoredTop100Games({ genreId, resolveStoredGameLikeState });

    await delay(250);

    return HttpResponse.json({
      ranked_at: '2026-04-21T00:00:00.000Z',
      results: games.map(toRawGameListItem),
    });
  }),

  http.get('/api/v1/games/list', async ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? '';
    const fuzzy = url.searchParams.get('fuzzy') !== 'false';
    const genreIdValue = url.searchParams.get('genre_id');
    const genreId = parseGenreId(genreIdValue);
    const sortValue = url.searchParams.get('sort');
    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const pageSize = parsePositiveInteger(
      url.searchParams.get('page_size'),
      DEFAULT_GAME_PAGE_SIZE,
    );
    const resolveStoredGameLikeState = (
      gameId: number,
      fallback: { isLiked: boolean | null; likeCount: number },
    ) => {
      const likeState = getMockGameLikeStateForAuthorization(
        request.headers.get('authorization'),
        gameId,
        fallback.likeCount,
      );

      return {
        isLiked: likeState.is_liked,
        likeCount: likeState.like_count,
      };
    };

    if (genreIdValue && (!genreId || !validGenreIds.has(genreId))) {
      return getErrorResponse(400, '유효하지 않은 genre_id 입니다. (1~14)');
    }

    if (sortValue && !VALID_GAME_SORT_VALUES.has(sortValue)) {
      return getErrorResponse(
        400,
        '유효하지 않은 sort 값입니다. (rating_desc, like_desc, created_at)',
      );
    }

    const { count, results } = searchStoredGames({
      search,
      fuzzy,
      genreId,
      sort:
        (sortValue as 'rating_desc' | 'like_desc' | 'created_at' | null) ??
        DEFAULT_GAME_SORT,
      page,
      pageSize,
      resolveStoredGameLikeState,
    });

    await delay(300);

    return HttpResponse.json({
      count,
      results: results.map(toRawGameListItem),
    });
  }),

  http.get('/api/v1/games/list/:gameId', async ({ params, request }) => {
    const gameId = Number(params.gameId);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return getErrorResponse(400, '유효하지 않은 game_id 입니다.');
    }

    const detail = getStoredGameDetail(gameId, (resolvedGameId, fallback) => {
      const likeState = getMockGameLikeStateForAuthorization(
        request.headers.get('authorization'),
        resolvedGameId,
        fallback.likeCount,
      );

      return {
        isLiked: likeState.is_liked,
        likeCount: likeState.like_count,
      };
    });

    if (!detail) {
      return getErrorResponse(404, '해당 게임을 찾을 수 없습니다.');
    }

    await delay(220);

    return HttpResponse.json(toRawGameDetail(detail));
  }),
];
