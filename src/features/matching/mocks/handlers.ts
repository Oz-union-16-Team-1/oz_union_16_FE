import { delay, http, HttpResponse } from 'msw';

import {
  getMockLikedGameIdsForAuthorization,
  syncMockLikedGamesForAuthorization,
} from '../../auth/mocks/handlers';
import { matchesGenreFilter, type GameGenreFilter } from '../../games/genres';
import { mockTopGames } from '../../games/mockGames';
import { getMatchingGenreById } from '../genres';
import {
  matchingMockCandidateMapById,
  matchingMockCandidatesByGenreId,
} from './data';

const getErrorResponse = (status: number, message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status },
  );

type StoredMatchResult = {
  game_id: number;
  rating: number;
  is_liked: boolean;
  created_at_order: number;
  mock_rank_score: number;
};

const DEFAULT_RECOMMENDATION_PAGE_SIZE = 5;
const DEFAULT_RECOMMENDATION_TOTAL_COUNT = 15;

let storedMatchResults: StoredMatchResult[] = [];

const MATCHING_RESULT_GENRE_FILTERS: Record<number, GameGenreFilter[]> = {
  1: ['액션', '대전 / 격투'],
  2: ['어드벤처', '플랫폼'],
  3: ['RPG', '어드벤처'],
  4: ['전략', '시뮬레이션'],
  5: ['스포츠', '레이싱'],
  6: ['전략', '카드 / 보드', '퍼즐'],
  7: ['슈팅', '액션'],
  8: ['음악 / 리듬', '퍼즐'],
};

const calculateMockRankScore = ({
  gameId,
  rating,
  isLiked,
  createdAtOrder,
  totalCount,
}: {
  gameId: number;
  rating: number;
  isLiked: boolean;
  createdAtOrder: number;
  totalCount: number;
}) => {
  const likedWeight = isLiked ? 35 : 0;
  const ratingWeight = rating * 4;
  const orderWeight = Math.max(totalCount - createdAtOrder, 0) * 2;
  const tieBreakerWeight = gameId % 7;

  return likedWeight + ratingWeight + orderWeight + tieBreakerWeight;
};

const getRankedMatchResults = () =>
  [...storedMatchResults].sort((a, b) => {
    if (b.mock_rank_score !== a.mock_rank_score) {
      return b.mock_rank_score - a.mock_rank_score;
    }

    return a.created_at_order - b.created_at_order;
  });

const toMockRecommendationRating = (candidateRating: number | null) =>
  typeof candidateRating === 'number'
    ? Number((candidateRating * 20).toFixed(1))
    : null;

const normalizeGenre = (value: string) => value.trim().toLowerCase();

const getSelectedGenreIdFromStoredResults = () => {
  const firstStoredResult = storedMatchResults[0];

  if (!firstStoredResult) {
    return null;
  }

  return (
    Object.entries(matchingMockCandidatesByGenreId).find(([, candidates]) =>
      candidates.some(
        (candidate) => candidate.game_id === firstStoredResult.game_id,
      ),
    )?.[0] ?? null
  );
};

const getGenreAffinityScore = (genres: string[], genreId: number | null) => {
  if (!genreId) {
    return 0;
  }

  const filters = MATCHING_RESULT_GENRE_FILTERS[genreId] ?? [];

  return filters.reduce(
    (score, filter) => score + (matchesGenreFilter(genres, filter) ? 18 : 0),
    0,
  );
};

const getGenreOverlapScore = (
  sourceGenres: string[],
  targetGenres: string[],
) => {
  const sourceGenreSet = new Set(sourceGenres.map(normalizeGenre));

  return targetGenres.reduce((score, genre) => {
    return sourceGenreSet.has(normalizeGenre(genre)) ? score + 1 : score;
  }, 0);
};

const getMockRecommendationResults = (authorization: string | null) => {
  const selectedGenreId = Number(getSelectedGenreIdFromStoredResults());
  const evaluatedGameIds = new Set(
    storedMatchResults.map((result) => result.game_id),
  );
  const currentLikedGameIds =
    getMockLikedGameIdsForAuthorization(authorization);
  const rankedEvaluations = getRankedMatchResults();

  const scoredResults = mockTopGames
    .filter((game) => !evaluatedGameIds.has(game.gameId))
    .map((game) => {
      const genreAffinityScore = getGenreAffinityScore(
        game.genres,
        selectedGenreId,
      );
      const popularityScore =
        typeof game.rating === 'number' ? game.rating * 0.28 : 0;
      const tasteScore = rankedEvaluations.reduce((score, evaluation) => {
        const candidate = matchingMockCandidateMapById.get(evaluation.game_id);

        if (!candidate) {
          return score;
        }

        const sharedGenreCount = getGenreOverlapScore(
          candidate.genres,
          game.genres,
        );

        if (sharedGenreCount === 0) {
          return score;
        }

        const ratingWeight = (evaluation.rating - 3) * 9;
        const likedWeight = evaluation.is_liked ? 10 : 0;
        const overlapWeight = sharedGenreCount * 6;

        return score + ratingWeight + likedWeight + overlapWeight;
      }, 0);
      const score =
        genreAffinityScore +
        popularityScore +
        tasteScore +
        ((game.gameId % 13) + 1) / 10;

      return {
        game_id: game.gameId,
        title: game.name,
        genres: game.genres,
        thumbnail_url: game.thumbnailUrl,
        rating:
          typeof game.rating === 'number'
            ? Number(game.rating.toFixed(1))
            : null,
        is_liked: currentLikedGameIds.has(game.gameId),
        mock_recommendation_score: score,
      };
    })
    .sort((a, b) => {
      if (b.mock_recommendation_score !== a.mock_recommendation_score) {
        return b.mock_recommendation_score - a.mock_recommendation_score;
      }

      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  return scoredResults
    .slice(0, DEFAULT_RECOMMENDATION_TOTAL_COUNT)
    .map(({ game_id, title, genres, thumbnail_url, rating, is_liked }) => ({
      game_id,
      title,
      genres,
      thumbnail_url,
      rating,
      is_liked,
    }));
};

export const matchingHandlers = [
  http.get('/api/v1/match/genres/image-url', async ({ request }) => {
    const url = new URL(request.url);
    const genreIdValue = url.searchParams.get('genre_id');
    const genreId = Number(genreIdValue);

    if (!genreIdValue || Number.isNaN(genreId) || genreId <= 0) {
      return getErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    const genre = getMatchingGenreById(genreId);

    if (!genre) {
      return getErrorResponse(404, '해당 장르의 이미지를 찾을 수 없습니다.');
    }

    await delay(300);

    return HttpResponse.json({
      genre_id: genre.genreId,
      genre_name: genre.title,
      image_url: genre.thumbnailUrl,
    });
  }),
  http.get('/api/v1/match/candidates', async ({ request }) => {
    const url = new URL(request.url);
    const genreIdValue = url.searchParams.get('genre_id');
    const genreId = Number(genreIdValue);

    if (!genreIdValue || Number.isNaN(genreId) || genreId <= 0) {
      return getErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    const candidates = matchingMockCandidatesByGenreId[genreId];
    const currentLikedGameIds = getMockLikedGameIdsForAuthorization(
      request.headers.get('Authorization'),
    );

    if (!candidates) {
      return getErrorResponse(404, '해당 장르의 게임을 찾을 수 없습니다.');
    }

    await delay(650);

    return HttpResponse.json({
      genre_id: genreId,
      count: candidates.length,
      results: candidates.map((candidate) => ({
        game_id: candidate.game_id,
        name: candidate.title,
        description: candidate.description,
        genres: candidate.genres,
        trailer_url: candidate.trailer_url,
        rating: candidate.rating,
        is_liked: currentLikedGameIds.has(candidate.game_id),
      })),
    });
  }),
  http.post('/api/v1/match/responses', async ({ request }) => {
    const body = (await request.json()) as {
      match_result?: Array<{
        game_id?: number;
        rating?: number;
        is_liked?: boolean;
      }>;
    };

    if (!Array.isArray(body.match_result) || body.match_result.length === 0) {
      return getErrorResponse(400, '평가할 match_result가 필요합니다.');
    }

    for (const result of body.match_result) {
      if (
        typeof result.game_id !== 'number' ||
        !matchingMockCandidateMapById.has(result.game_id)
      ) {
        return getErrorResponse(404, '해당 게임을 찾을 수 없습니다.');
      }

      if (
        typeof result.rating !== 'number' ||
        !Number.isInteger(result.rating) ||
        result.rating < 1 ||
        result.rating > 5
      ) {
        return getErrorResponse(400, '1~5 사이 정수여야 합니다.');
      }
    }

    storedMatchResults = body.match_result.map((result, index, allResults) => ({
      game_id: result.game_id!,
      rating: result.rating!,
      is_liked: Boolean(result.is_liked),
      created_at_order: index,
      mock_rank_score: calculateMockRankScore({
        gameId: result.game_id!,
        rating: result.rating!,
        isLiked: Boolean(result.is_liked),
        createdAtOrder: index,
        totalCount: allResults.length,
      }),
    }));

    syncMockLikedGamesForAuthorization(
      request.headers.get('Authorization'),
      body.match_result.map((result) => {
        const candidate = matchingMockCandidateMapById.get(result.game_id!)!;

        return {
          game_id: candidate.game_id,
          game_title: candidate.title,
          thumbnail_url: candidate.thumbnail_url,
          genres: candidate.genres,
          is_liked: Boolean(result.is_liked),
        };
      }),
    );

    await delay(500);

    return HttpResponse.json({
      user_id: 1,
      match_result: storedMatchResults.map((result) => ({
        game_id: result.game_id,
        rating: result.rating,
        is_liked: result.is_liked,
      })),
    });
  }),
  http.get('/api/v1/match/responses/result', async ({ request }) => {
    if (storedMatchResults.length === 0) {
      return getErrorResponse(404, '매칭 추천 결과를 찾을 수 없습니다.');
    }

    const url = new URL(request.url);
    const cursor = Number(url.searchParams.get('cursor') ?? '0');
    const pageSize = Number(
      url.searchParams.get('page_size') ?? DEFAULT_RECOMMENDATION_PAGE_SIZE,
    );

    const results = getMockRecommendationResults(
      request.headers.get('Authorization'),
    ).map((result) => ({
      ...result,
      rating:
        typeof result.rating === 'number'
          ? Number(result.rating.toFixed(1))
          : toMockRecommendationRating(result.rating),
    }));
    const startIndex = Number.isNaN(cursor) ? 0 : cursor;
    const nextIndex = startIndex + pageSize;
    const next = nextIndex < results.length ? String(nextIndex) : null;

    await delay(450);

    return HttpResponse.json({
      user_id: 1,
      count: results.length,
      next,
      results: results.slice(startIndex, nextIndex),
    });
  }),
];
