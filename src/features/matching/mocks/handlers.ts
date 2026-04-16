import { delay, http, HttpResponse } from 'msw';

import { matchingMockCandidatesByGenreId } from './data';

const getErrorResponse = (status: number, message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status },
  );

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
];
