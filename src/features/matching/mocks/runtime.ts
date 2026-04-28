import type { MatchingCandidatesResponse } from '../types';
import { matchingMockCandidatesByGenreId } from './data';

export const getMatchingMockCandidatesForRetry = (
  genreId: number,
  retryNo = 0,
) => {
  const candidates = matchingMockCandidatesByGenreId[genreId] ?? [];

  if (candidates.length === 0) {
    return [];
  }

  const normalizedRetryNo =
    Number.isInteger(retryNo) && retryNo >= 0 ? retryNo : 0;
  const rotationIndex = normalizedRetryNo % candidates.length;

  if (rotationIndex === 0) {
    return candidates;
  }

  return [
    ...candidates.slice(rotationIndex),
    ...candidates.slice(0, rotationIndex),
  ];
};

export const getMatchingMockCandidatesSnapshot = (
  genreId: number,
  retryNo = 0,
): MatchingCandidatesResponse => {
  const candidates = getMatchingMockCandidatesForRetry(genreId, retryNo);

  return {
    genre_id: genreId,
    count: candidates.length,
    results: candidates.map((candidate) => ({
      game_id: candidate.game_id,
      title: candidate.title,
      description: candidate.description,
      genres: candidate.genres,
      thumbnail_url: candidate.thumbnail_url,
      trailer_url: candidate.trailer_url,
      rating: candidate.rating,
      is_liked: false,
    })),
  };
};
