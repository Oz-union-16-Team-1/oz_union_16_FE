import { api } from '../../api/axios';
import { getGameGenreId } from './genres';
import type {
  GameDetail,
  GameLikeResponse,
  GameListItem,
  GameListResponse,
  GetTopGamesParams,
  RawGameDetailResponse,
  RawGameLikeResponse,
  RawGameListItem,
  SearchGamesParams,
  SearchGamesResult,
} from './types';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT = 'rating_desc';

const getGenreQueryParams = (genre: GetTopGamesParams['genre'] = '전체') => {
  const genreId = getGameGenreId(genre);

  return genreId ? { genre_id: genreId } : {};
};

const normalizeNullableString = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue !== 'N/A' ? trimmedValue : null;
};

const normalizeGameListItem = (game: RawGameListItem): GameListItem => ({
  gameId: game.game_id,
  name: game.name || 'N/A',
  genres: game.genres?.length ? game.genres : ['N/A'],
  thumbnailUrl: game.thumbnail_url,
  rating: game.rating,
  isLiked: typeof game.is_liked === 'boolean' ? game.is_liked : undefined,
});

const normalizeGameDetail = (game: RawGameDetailResponse): GameDetail => ({
  gameId: game.game_id,
  title: game.title || 'N/A',
  genres: game.genres?.length ? game.genres : ['N/A'],
  releaseDate: game.release_date || null,
  developer: game.developer || null,
  publisher: game.publisher || null,
  promoVideoUrl: normalizeNullableString(game.media?.promo_video_url),
  promoEmbedUrl: normalizeNullableString(game.media?.promo_embed_url),
  coverImageUrl: normalizeNullableString(game.media?.cover_image_url),
  description: game.description || null,
  externalLinks: {
    officialSite: normalizeNullableString(game.external_links?.official_site),
    steam: normalizeNullableString(game.external_links?.steam),
    epicStore: normalizeNullableString(game.external_links?.epic_store),
  },
  likeCount: game.like_count ?? 0,
  isLiked: typeof game.is_liked === 'boolean' ? game.is_liked : null,
});

const normalizeGameLikeResponse = (
  response: RawGameLikeResponse,
): GameLikeResponse => ({
  gameId: response.game_id,
  isLiked: response.is_liked,
  likeCount: response.like_count ?? 0,
});

export const getTopGames = async ({
  genre = '전체',
}: GetTopGamesParams = {}): Promise<GameListItem[]> => {
  const response = await api.get<GameListResponse>(
    '/api/v1/games/list/top100',
    {
      params: getGenreQueryParams(genre),
    },
  );

  return response.data.results.map(normalizeGameListItem);
};

export const searchGames = async ({
  search,
  fuzzy = true,
  genre = '전체',
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  sort = DEFAULT_SORT,
}: SearchGamesParams): Promise<SearchGamesResult> => {
  const response = await api.get<GameListResponse>('/api/v1/games/list', {
    params: {
      search,
      fuzzy,
      sort,
      page,
      page_size: pageSize,
      ...getGenreQueryParams(genre),
    },
  });

  return {
    count: response.data.count ?? response.data.results.length,
    results: response.data.results.map(normalizeGameListItem),
  };
};

export const getGameDetail = async (gameId: number): Promise<GameDetail> => {
  const response = await api.get<RawGameDetailResponse>(
    `/api/v1/games/list/${gameId}`,
  );

  return normalizeGameDetail(response.data);
};

export const likeGame = async (gameId: number): Promise<GameLikeResponse> => {
  const response = await api.post<RawGameLikeResponse>(
    `/api/v1/games/${gameId}/like`,
  );

  return normalizeGameLikeResponse(response.data);
};

export const unlikeGame = async (gameId: number): Promise<GameLikeResponse> => {
  const response = await api.delete<RawGameLikeResponse>(
    `/api/v1/games/${gameId}/like`,
  );

  return normalizeGameLikeResponse(response.data);
};
