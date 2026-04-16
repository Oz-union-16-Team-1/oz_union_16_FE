import { delay, http, HttpResponse } from 'msw';

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
};

let storedMatchResults: StoredMatchResult[] = [];

const getSortedMatchResults = (sort: string) => {
  const entries = [...storedMatchResults];

  if (sort === 'created_at') {
    return entries.sort((a, b) => a.created_at_order - b.created_at_order);
  }

  return entries.sort((a, b) => b.rating - a.rating);
};

export const matchingHandlers = [
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
      next: null,
      results: candidates,
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

    storedMatchResults = body.match_result.map((result, index) => ({
      game_id: result.game_id!,
      rating: result.rating!,
      is_liked: Boolean(result.is_liked),
      created_at_order: index,
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
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') ?? 'rating_desc';

    if (!['rating_desc', 'created_at'].includes(sort)) {
      return getErrorResponse(
        400,
        '유효하지 않은 sort 값입니다. (rating_desc, created_at)',
      );
    }

    if (storedMatchResults.length === 0) {
      return getErrorResponse(404, '매칭 추천 결과를 찾을 수 없습니다.');
    }

    const results = getSortedMatchResults(sort).map((result) => {
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

    await delay(450);

    return HttpResponse.json({
      user_id: 1,
      count: results.length,
      next: null,
      results,
    });
  }),
];
