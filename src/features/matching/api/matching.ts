import { api } from '../../../api/axios';
import type { MatchingCandidatesResponse } from '../types';

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
