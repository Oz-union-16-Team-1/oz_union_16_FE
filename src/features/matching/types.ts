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

export interface MatchingGenreImageResponse {
  genre_id: number;
  genre_name: string;
  image_url: string;
}

export interface MatchingApiCandidateItem {
  game_id: number;
  name: string;
  description: string;
  genres: string[];
  trailer_url: string | null;
  rating: number | null;
  is_liked: boolean;
}

export interface MatchingApiCandidatesResponse {
  genre_id: number;
  count: number;
  results: MatchingApiCandidateItem[];
}

export interface MatchingCandidateItem {
  game_id: number;
  title: string;
  description: string;
  genres: string[];
  thumbnail_url: string | null;
  trailer_url: string | null;
  rating: number | null;
  is_liked: boolean;
}

export interface MatchingCandidatesResponse {
  genre_id: number;
  count: number;
  results: MatchingCandidateItem[];
}

export type MatchingRatingValue = 1 | 2 | 3 | 4 | 5;

export interface MatchingEvaluationValue {
  rating: MatchingRatingValue | null;
  isLiked: boolean;
}

export type MatchingEvaluationsByGameId = Record<
  number,
  MatchingEvaluationValue
>;

export interface MatchResponseItem {
  game_id: number;
  rating: MatchingRatingValue;
  is_liked: boolean;
}

export interface SubmitMatchResponsesRequest {
  match_result: MatchResponseItem[];
}

export interface SubmitMatchResponsesResponse {
  user_id: number;
  match_result: MatchResponseItem[];
}

export interface MatchResultQuery {
  cursor?: string;
  page_size?: number;
}

export interface MatchResultItem {
  game_id: number;
  title: string;
  genres: string[];
  thumbnail_url: string | null;
  rating: number;
  is_liked: boolean;
}

export interface MatchResultResponse {
  user_id: number;
  count: number;
  next: string | null;
  results: MatchResultItem[];
}
