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
import { getMatchingMockCandidatesForRetry } from './runtime';
import { mockErrorResponse } from '../../../mocks/helpers';

type StoredMatchResult = {
  game_id: number;
  rating: number;
  is_liked: boolean;
  created_at_order: number;
  mock_rank_score: number;
};

type StoredMatchContext = {
  genre_id: number;
  retry_no: number;
  candidate_date?: string;
  results: StoredMatchResult[];
};

const DEFAULT_RECOMMENDATION_PAGE_SIZE = 5;
const DEFAULT_RECOMMENDATION_TOTAL_COUNT = 15;

let storedMatchContext: StoredMatchContext | null = null;

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
  [...(storedMatchContext?.results ?? [])].sort((a, b) => {
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
  const selectedGenreId = storedMatchContext?.genre_id ?? null;
  const evaluatedGameIds = new Set(
    (storedMatchContext?.results ?? []).map((result) => result.game_id),
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

    if (
      !genreIdValue ||
      Number.isNaN(genreId) ||
      !Number.isInteger(genreId) ||
      genreId < 1 ||
      genreId > 8
    ) {
      return mockErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    const genre = getMatchingGenreById(genreId);

    if (!genre) {
      return mockErrorResponse(404, '해당 장르의 이미지를 찾을 수 없습니다.');
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
    const retryNoValue = url.searchParams.get('retry_no');
    const genreId = Number(genreIdValue);
    const retryNo = retryNoValue !== null ? Number(retryNoValue) : 0;

    if (
      !genreIdValue ||
      Number.isNaN(genreId) ||
      !Number.isInteger(genreId) ||
      genreId < 1 ||
      genreId > 8
    ) {
      return mockErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    if (
      retryNoValue !== null &&
      (Number.isNaN(retryNo) || !Number.isInteger(retryNo) || retryNo < 0)
    ) {
      return mockErrorResponse(400, 'retry_no는 0 이상의 정수여야 합니다.');
    }

    const candidatesByGenre = matchingMockCandidatesByGenreId[genreId];
    const candidates = getMatchingMockCandidatesForRetry(genreId, retryNo);
    const currentLikedGameIds = getMockLikedGameIdsForAuthorization(
      request.headers.get('Authorization'),
    );

    if (!candidatesByGenre) {
      return mockErrorResponse(404, '해당 장르의 게임을 찾을 수 없습니다.');
    }

    await delay(650);

    return HttpResponse.json({
      genre_id: genreId,
      retry_no: retryNo,
      count: candidates.length,
      results: candidates.map((candidate) => ({
        game_id: candidate.game_id,
        title: candidate.title,
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
      genre_id?: number;
      retry_no?: number;
      candidate_date?: string;
      match_result?: Array<{
        game_id?: number;
        rating?: number;
        is_liked?: boolean;
      }>;
    };

    if (
      typeof body.genre_id !== 'number' ||
      !Number.isInteger(body.genre_id) ||
      body.genre_id < 1 ||
      body.genre_id > 8
    ) {
      return mockErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    if (
      typeof body.retry_no !== 'number' ||
      !Number.isInteger(body.retry_no) ||
      body.retry_no < 0
    ) {
      return mockErrorResponse(400, 'retry_no는 0 이상의 정수여야 합니다.');
    }

    if (!Array.isArray(body.match_result) || body.match_result.length === 0) {
      return mockErrorResponse(400, '평가할 match_result가 필요합니다.');
    }

    const currentCandidates = getMatchingMockCandidatesForRetry(
      body.genre_id,
      body.retry_no,
    );
    const candidateIdSet = new Set(
      currentCandidates.map((candidate) => candidate.game_id),
    );

    for (const result of body.match_result) {
      const rating = result.rating;

      if (typeof result.game_id !== 'number') {
        return mockErrorResponse(400, 'game_id는 정수여야 합니다.');
      }

      if (!candidateIdSet.has(result.game_id)) {
        return mockErrorResponse(
          400,
          '후보 세트에 없는 game_id가 포함되어 있습니다.',
        );
      }

      if (typeof rating !== 'number' || !Number.isInteger(rating)) {
        return mockErrorResponse(400, 'rating은 정수여야 합니다.');
      }

      if (rating < 1 || rating > 5) {
        return mockErrorResponse(400, 'rating은 1~5 사이의 정수여야 합니다.');
      }
    }

    storedMatchContext = {
      genre_id: body.genre_id,
      retry_no: body.retry_no,
      candidate_date: body.candidate_date,
      results: body.match_result.map((result, index, allResults) => ({
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
      })),
    };

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
      match_result: (storedMatchContext?.results ?? []).map((result) => ({
        game_id: result.game_id,
        rating: result.rating,
        is_liked: result.is_liked,
      })),
    });
  }),
  http.get('/api/v1/match/responses/result', async ({ request }) => {
    const url = new URL(request.url);
    const genreIdValue = url.searchParams.get('genre_id');
    const genreId = Number(genreIdValue);
    const cursorParam = url.searchParams.get('cursor');
    const cursor =
      cursorParam !== null && !Number.isNaN(Number(cursorParam))
        ? Number(cursorParam)
        : 0;
    const pageSize = Number(
      url.searchParams.get('page_size') ?? DEFAULT_RECOMMENDATION_PAGE_SIZE,
    );

    if (
      !genreIdValue ||
      Number.isNaN(genreId) ||
      !Number.isInteger(genreId) ||
      genreId < 1 ||
      genreId > 8
    ) {
      return mockErrorResponse(400, '유효하지 않은 genre_id 입니다.');
    }

    if (!storedMatchContext || storedMatchContext.genre_id !== genreId) {
      return mockErrorResponse(404, '매칭 추천 결과를 찾을 수 없습니다.');
    }

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
