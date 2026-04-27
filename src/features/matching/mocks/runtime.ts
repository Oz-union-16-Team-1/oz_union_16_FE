import type { MatchingCandidatesResponse } from '../types';
import { matchingMockCandidatesByGenreId } from './data';

export const getMatchingMockCandidatesSnapshot = (
  genreId: number,
): MatchingCandidatesResponse => {
  const candidates = matchingMockCandidatesByGenreId[genreId] ?? [];

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
