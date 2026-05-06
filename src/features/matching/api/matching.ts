import { api } from '../../../api/axios';
import { isMockServiceWorkerEnabled } from '../../../lib/env';
import { getMatchingMockCandidatesSnapshot } from '../mocks/runtime';
import type {
  MatchingApiCandidateItem,
  MatchingApiCandidatesResponse,
  MatchingGenreImageResponse,
  MatchResultQuery,
  MatchResultResponse,
  MatchingCandidatesResponse,
  SubmitMatchResponsesRequest,
  SubmitMatchResponsesResponse,
} from '../types';

const MATCHING_BASE_PATH = '/api/v1/match';
const MATCHING_CANDIDATES_REQUEST_TIMEOUT_MS = 15_000;

const normalizeMatchCandidate = (item: MatchingApiCandidateItem) => ({
  game_id: item.game_id,
  title: item.title?.trim() || '제목 정보 준비 중',
  description:
    item.description?.trim() || '게임 설명이 아직 준비되지 않았습니다.',
  genres: Array.isArray(item.genres) ? item.genres : [],
  thumbnail_url: null,
  trailer_url: item.trailer_url ?? null,
  rating: typeof item.rating === 'number' ? item.rating : null,
  is_liked: Boolean(item.is_liked),
});

export const getMatchCandidates = async (
  genreId: number,
  retryNo?: number,
  signal?: AbortSignal,
) => {
  const getMockFallback = () =>
    getMatchingMockCandidatesSnapshot(genreId, retryNo ?? 0);

  try {
    const response = await api.get<MatchingApiCandidatesResponse>(
      `${MATCHING_BASE_PATH}/candidates`,
      {
        params: {
          genre_id: genreId,
          ...(typeof retryNo === 'number' ? { retry_no: retryNo } : {}),
        },
        signal,
        timeout: MATCHING_CANDIDATES_REQUEST_TIMEOUT_MS,
      },
    );

    const results = Array.isArray(response.data.results)
      ? response.data.results.map(normalizeMatchCandidate)
      : [];

    if (isMockServiceWorkerEnabled() && results.length === 0) {
      return getMockFallback();
    }

    return {
      genre_id: response.data.genre_id,
      retry_no: response.data.retry_no,
      count: response.data.count,
      results,
    } satisfies MatchingCandidatesResponse;
  } catch (error) {
    if (!isMockServiceWorkerEnabled()) {
      throw error;
    }

    return getMockFallback();
  }
};

export const getMatchingGenreImage = async (genreId: number) => {
  const response = await api.get<MatchingGenreImageResponse>(
    `${MATCHING_BASE_PATH}/genres/image-url`,
    {
      params: {
        genre_id: genreId,
      },
    },
  );

  return response.data;
};

export const submitMatchResponses = async (
  payload: SubmitMatchResponsesRequest,
) => {
  const response = await api.post<SubmitMatchResponsesResponse>(
    `${MATCHING_BASE_PATH}/responses`,
    payload,
  );

  return response.data;
};

export const getMatchResponseResults = async (query: MatchResultQuery) => {
  const response = await api.get<MatchResultResponse>(
    `${MATCHING_BASE_PATH}/responses/result`,
    {
      params: query,
    },
  );

  return response.data;
};
