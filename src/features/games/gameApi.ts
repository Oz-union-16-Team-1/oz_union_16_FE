import { api } from '../../api/axios';
import { matchesGenreFilter } from './genres';
import { mockTopGames } from './mockGames';
import type {
  GameDetail,
  GameListItem,
  GameListResponse,
  GetTopGamesParams,
  RawGameDetailResponse,
  RawGameListItem,
  SearchGamesParams,
} from './types';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT = 'rating_desc';

const hasApiBaseUrl = Boolean(import.meta.env.VITE_API_BASE_URL);

const getMockDetail = async (gameId: number) => {
  const { getMockGameDetail } = await import('./mockGameDetails');

  return getMockGameDetail(gameId);
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
  promoVideoUrl: game.media?.promo_video_url || null,
  coverImageUrl: game.media?.cover_image_url || null,
  description: game.description || null,
  platforms:
    game.platforms
      ?.map((platform) => platform.name?.trim())
      .filter((name): name is string => Boolean(name))
      .map((name) => ({ name })) ?? [],
  externalLinks: {
    officialSite: game.external_links?.official_site || null,
    steam: game.external_links?.steam || null,
    epicStore: game.external_links?.epic_store || null,
  },
  likeCount: game.like_count ?? 0,
  isLiked: typeof game.is_liked === 'boolean' ? game.is_liked : null,
});

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
    );

    return filterGames(response.data.results.map(normalizeGameListItem), {
      genre,
    });
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
      },
    });

    return filterGames(response.data.results.map(normalizeGameListItem), {
      search,
      genre,
    });
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
  } catch {
    return getMockDetail(gameId);
  }
};
