import type { GameGenreFilter } from './genres';

export type GameListItem = {
  gameId: number;
  name: string;
  genres: string[];
  thumbnailUrl: string | null;
  rating: number | null;
  isLiked?: boolean;
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
  is_liked?: boolean | null;
};

export type GameDetail = {
  gameId: number;
  title: string;
  genres: string[];
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  promoVideoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  platforms: Array<{ name: string }>;
  externalLinks: {
    officialSite?: string | null;
    steam?: string | null;
    epicStore?: string | null;
  };
  likeCount: number;
  isLiked: boolean | null;
};

export type RawGameDetailResponse = {
  game_id: number;
  title: string | null;
  genres: string[] | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  media: {
    promo_video_url?: string | null;
    cover_image_url?: string | null;
  } | null;
  description: string | null;
  platforms: Array<{ name: string | null }> | null;
  external_links: {
    official_site?: string | null;
    steam?: string | null;
    epic_store?: string | null;
  } | null;
  like_count: number | null;
  is_liked: boolean | null;
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
