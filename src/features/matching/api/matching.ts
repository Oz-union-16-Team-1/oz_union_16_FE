import { api } from '../../../api/axios';
import type {
  MatchResultQuery,
  MatchResultResponse,
  MatchingCandidatesResponse,
  SubmitMatchResponsesRequest,
  SubmitMatchResponsesResponse,
} from '../types';

const MATCHING_BASE_PATH = '/api/v1/match';

export const getMatchCandidates = async (genreId: number) => {
  const response = await api.get<MatchingCandidatesResponse>(
    `${MATCHING_BASE_PATH}/candidates`,
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
