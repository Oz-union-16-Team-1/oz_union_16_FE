import type { GameGenreFilter } from './genres';

export type GameListItem = {
  gameId: number;
  name: string;
  genres: string[];
  thumbnailUrl: string | null;
  rating: number | null;
};

export type GameListResponse = {
  count?: number;
  ranked_at?: string;
  results: RawGameListItem[];
};

export type RawGameListItem = {
  game_id: number;
  name: string | null;
  genres: string[] | null;
  thumbnail_url: string | null;
  rating: number | null;
};

export type GetTopGamesParams = {
  genre?: GameGenreFilter;
};

export type SearchGamesParams = {
  search: string;
  genre?: GameGenreFilter;
  page?: number;
  pageSize?: number;
  sort?: 'rating_desc' | 'like_desc' | 'created_at';
};
