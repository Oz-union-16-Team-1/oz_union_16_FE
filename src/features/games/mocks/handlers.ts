import { delay, http, HttpResponse } from 'msw';

import { getMockGameLikeStateForAuthorization } from '../../auth/mocks/handlers';
import { GAME_GENRE_ID_MAP } from '../genres';
import {
  mockErrorResponse,
  parsePositiveInteger,
} from '../../../mocks/helpers';
import { getStoredGameDetail, searchStoredGames } from './state';
import type {
  GameDetail,
  GameListItem,
  RawGameDetailResponse,
  RawGameListItem,
} from '../types';

const DEFAULT_GAME_PAGE_SIZE = 20;
const DEFAULT_TOP_GAMES_PAGE_SIZE = 100;
const validGenreIds = new Set([0, ...Object.values(GAME_GENRE_ID_MAP)]);

const parseGenreId = (value: string | null) => {
  if (value === null || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const toRawGameListItem = (game: GameListItem): RawGameListItem => ({
  game_id: game.gameId,
  name: game.name,
  genres: game.genres,
  thumbnail_url: game.thumbnailUrl,
  rating: game.rating,
  is_liked: game.isLiked ?? null,
  like_count: game.likeCount ?? null,
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
    const genreId = parseGenreId(genreIdValue);
    const search = url.searchParams.get('search') ?? '';
    const fuzzy = url.searchParams.get('fuzzy') !== 'false';
    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const pageSize = parsePositiveInteger(
      url.searchParams.get('page_size'),
      search.trim() ? DEFAULT_GAME_PAGE_SIZE : DEFAULT_TOP_GAMES_PAGE_SIZE,
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

    if (!genreIdValue || genreId === undefined || !validGenreIds.has(genreId)) {
      return mockErrorResponse(400, '유효하지 않은 genre_id 입니다. (0~14)');
    }

    const { count, results } = searchStoredGames({
      search,
      fuzzy,
      genreId,
      page,
      pageSize,
      resolveStoredGameLikeState,
    });
    const next = page * pageSize < count ? page + 1 : null;

    await delay(250);

    return HttpResponse.json({
      ranked_at: '2026-04-21T00:00:00.000Z',
      count,
      next,
      results: results.map(toRawGameListItem),
    });
  }),

  http.get('/api/v1/games/list/:gameId', async ({ params, request }) => {
    const gameId = Number(params.gameId);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return mockErrorResponse(400, '유효하지 않은 game_id 입니다.');
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
      return mockErrorResponse(404, '해당 게임을 찾을 수 없습니다.');
    }

    await delay(220);

    return HttpResponse.json(toRawGameDetail(detail));
  }),
];
