import { AxiosError } from 'axios';

import { api } from '../../api/axios';
import { getGameGenreId, matchesGenreFilter } from './genres';
import { mockTopGames } from './mockGames';
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
} from './types';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT = 'rating_desc';

const hasApiBaseUrl = Boolean(import.meta.env.VITE_API_BASE_URL);

const getGenreQueryParams = (genre: GetTopGamesParams['genre'] = '전체') => {
  const genreId = getGameGenreId(genre);

  return genreId ? { genre_id: genreId } : {};
};

const getMockDetail = async (gameId: number) => {
  const { getMockGameDetail } = await import('./mockGameDetails');

  return getMockGameDetail(gameId);
};

const updateMockLikeStatus = async (gameId: number, isLiked: boolean) => {
  const { updateMockGameLikeStatus } = await import('./mockGameDetails');

  return updateMockGameLikeStatus(gameId, isLiked);
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
  platforms:
    game.platforms
      ?.map((platform) => platform.name?.trim())
      .filter((name): name is string => Boolean(name))
      .map((name) => ({ name })) ?? [],
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

const isNotFoundError = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 404;

const filterGames = (
  games: GameListItem[],
  {
    search = '',
    genre = '전체',
  }: {
    search?: string;
    genre?: GetTopGamesParams['genre'];
  } = {},
) => {
  const normalizedSearch = search.trim().toLowerCase();

  return games.filter((game) => {
    const matchesSearch =
      !normalizedSearch ||
      [game.name, ...game.genres].some((keyword) =>
        keyword.toLowerCase().includes(normalizedSearch),
      );
    const matchesGenre = matchesGenreFilter(game.genres, genre);

    return matchesSearch && matchesGenre;
  });
};

export const getTopGames = async ({
  genre = '전체',
}: GetTopGamesParams = {}): Promise<GameListItem[]> => {
  if (!hasApiBaseUrl) {
    return filterGames(mockTopGames, { genre });
  }

  try {
    const response = await api.get<GameListResponse>(
      '/api/v1/games/list/top100',
      {
        params: getGenreQueryParams(genre),
      },
    );

    return response.data.results.map(normalizeGameListItem);
  } catch {
    return filterGames(mockTopGames, { genre });
  }
};

export const searchGames = async ({
  search,
  genre = '전체',
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  sort = DEFAULT_SORT,
}: SearchGamesParams): Promise<GameListItem[]> => {
  if (!hasApiBaseUrl) {
    return filterGames(mockTopGames, { search, genre });
  }

  try {
    const response = await api.get<GameListResponse>('/api/v1/games/list', {
      params: {
        search,
        fuzzy: true,
        sort,
        page,
        page_size: pageSize,
        ...getGenreQueryParams(genre),
      },
    });

    return response.data.results.map(normalizeGameListItem);
  } catch {
    return filterGames(mockTopGames, { search, genre });
  }
};

export const getGameDetail = async (gameId: number): Promise<GameDetail> => {
  if (!hasApiBaseUrl) {
    return getMockDetail(gameId);
  }

  try {
    const response = await api.get<RawGameDetailResponse>(
      `/api/v1/games/list/${gameId}`,
    );

    return normalizeGameDetail(response.data);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw error;
    }

    return getMockDetail(gameId);
  }
};

export const likeGame = async (gameId: number): Promise<GameLikeResponse> => {
  if (!hasApiBaseUrl) {
    return updateMockLikeStatus(gameId, true);
  }

  const response = await api.post<RawGameLikeResponse>(
    `/api/v1/games/${gameId}/like`,
  );

  return normalizeGameLikeResponse(response.data);
};

export const unlikeGame = async (gameId: number): Promise<GameLikeResponse> => {
  if (!hasApiBaseUrl) {
    return updateMockLikeStatus(gameId, false);
  }

  const response = await api.delete<RawGameLikeResponse>(
    `/api/v1/games/${gameId}/like`,
  );

  return normalizeGameLikeResponse(response.data);
};
