export type MatchingGenreSlug =
  | 'action-fighting'
  | 'adventure-platform'
  | 'rpg-story'
  | 'strategy-simulation'
  | 'sports-racing'
  | 'brain-strategy'
  | 'shooting'
  | 'rhythm';

export type MatchingGenreCard = {
  slug: MatchingGenreSlug;
  genreId: number;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
};

export interface MatchingCandidateItem {
  game_id: number;
  title: string;
  genres: string[];
  thumbnail_url: string | null;
  trailer_url: string | null;
  rating: number | null;
  is_liked: boolean;
}

export interface MatchingCandidatesResponse {
  genre_id: number;
  count: number;
  next: string | null;
  results: MatchingCandidateItem[];
}
