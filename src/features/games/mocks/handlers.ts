import { delay, http, HttpResponse } from 'msw';

import { GAME_GENRE_ID_MAP } from '../genres';
import {
  getStoredGameDetail,
  getStoredTop100Games,
  searchStoredGames,
  updateStoredGameLike,
} from './state';
import type {
  GameDetail,
  GameLikeResponse,
  GameListItem,
  RawGameDetailResponse,
  RawGameLikeResponse,
  RawGameListItem,
} from '../types';

const DEFAULT_GAME_PAGE_SIZE = 20;
const DEFAULT_GAME_SORT = 'rating_desc';
const validGenreIds = new Set(Object.values(GAME_GENRE_ID_MAP));

const getErrorResponse = (status: number, message: string) =>
  HttpResponse.json(
    {
      detail: message,
    },
    { status },
  );

const getUnauthorizedResponse = () =>
  HttpResponse.json(
    {
      error_detail: '로그인이 필요합니다.',
    },
    { status: 401 },
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

const toRawGameLikeResponse = (
  response: GameLikeResponse,
): RawGameLikeResponse => ({
  game_id: response.gameId,
  is_liked: response.isLiked,
  like_count: response.likeCount,
});

export const gamesHandlers = [
  http.get('/api/v1/games/list/top100', async ({ request }) => {
    const url = new URL(request.url);
    const genreIdValue = url.searchParams.get('genre_id');
    const genreId = parseGenreId(url.searchParams.get('genre_id'));

    if (genreIdValue && (!genreId || !validGenreIds.has(genreId))) {
      return getErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    const games = getStoredTop100Games({ genreId });

    await delay(250);

    return HttpResponse.json({
      count: games.length,
      ranked_at: '2026-04-21T00:00:00.000Z',
      results: games.map(toRawGameListItem),
    });
  }),

  http.get('/api/v1/games/list', async ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? '';
    const genreIdValue = url.searchParams.get('genre_id');
    const genreId = parseGenreId(genreIdValue);
    const sort =
      (url.searchParams.get('sort') as
        | 'rating_desc'
        | 'like_desc'
        | 'created_at'
        | null) ?? DEFAULT_GAME_SORT;
    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const pageSize = parsePositiveInteger(
      url.searchParams.get('page_size'),
      DEFAULT_GAME_PAGE_SIZE,
    );

    if (genreIdValue && (!genreId || !validGenreIds.has(genreId))) {
      return getErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    const { count, results } = searchStoredGames({
      search,
      genreId,
      sort:
        sort === 'like_desc' || sort === 'created_at' || sort === 'rating_desc'
          ? sort
          : DEFAULT_GAME_SORT,
      page,
      pageSize,
    });

    await delay(300);

    return HttpResponse.json({
      count,
      results: results.map(toRawGameListItem),
    });
  }),

  http.get('/api/v1/games/list/:gameId', async ({ params }) => {
    const gameId = Number(params.gameId);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return getErrorResponse(400, '유효하지 않은 game_id 입니다.');
    }

    const detail = getStoredGameDetail(gameId);

    if (!detail) {
      return getErrorResponse(404, '해당 게임 상세 정보를 찾을 수 없습니다.');
    }

    await delay(220);

    return HttpResponse.json(toRawGameDetail(detail));
  }),

  http.post('/api/v1/games/:gameId/like', async ({ params, request }) => {
    if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
      return getUnauthorizedResponse();
    }

    const gameId = Number(params.gameId);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return getErrorResponse(400, '유효하지 않은 game_id 입니다.');
    }

    const response = updateStoredGameLike(gameId, true);

    if (!response) {
      return getErrorResponse(404, '해당 게임을 찾을 수 없습니다.');
    }

    await delay(180);

    return HttpResponse.json(toRawGameLikeResponse(response));
  }),

  http.delete('/api/v1/games/:gameId/like', async ({ params, request }) => {
    if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
      return getUnauthorizedResponse();
    }

    const gameId = Number(params.gameId);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return getErrorResponse(400, '유효하지 않은 game_id 입니다.');
    }

    const response = updateStoredGameLike(gameId, false);

    if (!response) {
      return getErrorResponse(404, '해당 게임을 찾을 수 없습니다.');
    }

    await delay(180);

    return HttpResponse.json(toRawGameLikeResponse(response));
  }),
];
