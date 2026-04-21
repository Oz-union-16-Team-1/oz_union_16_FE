import { delay, http, HttpResponse } from 'msw';

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

let storedMatchResults: StoredMatchResult[] = [];

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
        is_liked: candidate.is_liked,
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

    const results = getRankedMatchResults().map((result) => {
      const candidate = matchingMockCandidateMapById.get(result.game_id)!;

      return {
        game_id: candidate.game_id,
        title: candidate.title,
        genres: candidate.genres,
        thumbnail_url: candidate.thumbnail_url,
        rating: result.rating,
        is_liked: result.is_liked,
      };
    });
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
