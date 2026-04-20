import { api } from '../../../api/axios';
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

const normalizeMatchCandidate = (item: MatchingApiCandidateItem) => ({
  game_id: item.game_id,
  title: item.name?.trim() || '제목 정보 준비 중',
  description:
    item.description?.trim() || '게임 설명이 아직 준비되지 않았습니다.',
  genres: Array.isArray(item.genres) ? item.genres : [],
  thumbnail_url: null,
  trailer_url: item.trailer_url ?? null,
  rating: typeof item.rating === 'number' ? item.rating : null,
  is_liked: Boolean(item.is_liked),
});

export const getMatchCandidates = async (genreId: number) => {
  const response = await api.get<MatchingApiCandidatesResponse>(
    `${MATCHING_BASE_PATH}/candidates`,
    {
      params: {
        genre_id: genreId,
      },
    },
  );

  return {
    genre_id: response.data.genre_id,
    count: response.data.count,
    results: Array.isArray(response.data.results)
      ? response.data.results.map(normalizeMatchCandidate)
      : [],
  } satisfies MatchingCandidatesResponse;
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
