import {
  GAME_GENRE_ID_MAP,
  matchesGenreFilter,
  type GameGenreFilter,
} from '../genres';
import { mockGameDetails } from '../mockGameDetails';
import { mockTopGames } from '../mockGames';
import type { GameDetail, GameListItem, GameLikeResponse } from '../types';

const steamStoreUrl = (gameId: number) =>
  `https://store.steampowered.com/app/${gameId}`;

const genreIdToFilterMap = new Map<number, GameGenreFilter>(
  Object.entries(GAME_GENRE_ID_MAP).map(([genre, genreId]) => [
    genreId,
    genre as Exclude<GameGenreFilter, '전체'>,
  ]),
);

const normalizeSearchKeyword = (value: string) => value.trim().toLowerCase();

const cloneGameDetail = (detail: GameDetail): GameDetail => ({
  ...detail,
  genres: [...detail.genres],
  externalLinks: { ...detail.externalLinks },
});

const createFallbackDetail = (game: GameListItem): GameDetail => ({
  gameId: game.gameId,
  title: game.name,
  genres: game.genres.length ? [...game.genres] : ['N/A'],
  releaseDate: null,
  developer: null,
  publisher: null,
  promoVideoUrl: null,
  promoEmbedUrl: null,
  coverImageUrl: game.thumbnailUrl,
  description: null,
  externalLinks: {
    officialSite: null,
    steam: steamStoreUrl(game.gameId),
    epicStore: null,
  },
  likeCount: 0,
  isLiked: game.isLiked ?? null,
});

const storedTopGames = mockTopGames.map((game) => ({ ...game }));
const topGameOrderById = new Map(
  storedTopGames.map((game, index) => [game.gameId, index]),
);
const storedDetails = new Map(
  Object.values(mockGameDetails).map((detail) => [
    detail.gameId,
    cloneGameDetail(detail),
  ]),
);

storedTopGames.forEach((game) => {
  const detail = storedDetails.get(game.gameId);

  if (typeof detail?.isLiked === 'boolean') {
    game.isLiked = detail.isLiked;
  }
});

const getStoredTopGame = (gameId: number) =>
  storedTopGames.find((game) => game.gameId === gameId) ?? null;

const ensureStoredDetail = (gameId: number) => {
  const existingDetail = storedDetails.get(gameId);

  if (existingDetail) {
    return existingDetail;
  }

  const topGame = getStoredTopGame(gameId);

  if (!topGame) {
    return null;
  }

  const fallbackDetail = createFallbackDetail(topGame);
  storedDetails.set(gameId, fallbackDetail);

  return fallbackDetail;
};

const getGenreFilterById = (genreId?: number) =>
  genreId ? (genreIdToFilterMap.get(genreId) ?? null) : '전체';

const getEffectiveLikeCount = (gameId: number) =>
  ensureStoredDetail(gameId)?.likeCount ?? 0;

const getEffectiveIsLiked = (gameId: number) =>
  ensureStoredDetail(gameId)?.isLiked ?? getStoredTopGame(gameId)?.isLiked;

const getHydratedTopGames = () =>
  storedTopGames.map((game) => {
    const isLiked = getEffectiveIsLiked(game.gameId);

    return typeof isLiked === 'boolean' ? { ...game, isLiked } : { ...game };
  });

const sortGames = (
  games: GameListItem[],
  sort: 'rating_desc' | 'like_desc' | 'created_at',
) =>
  [...games].sort((left, right) => {
    if (sort === 'created_at') {
      return (
        (topGameOrderById.get(left.gameId) ?? Number.MAX_SAFE_INTEGER) -
        (topGameOrderById.get(right.gameId) ?? Number.MAX_SAFE_INTEGER)
      );
    }

    if (sort === 'like_desc') {
      const likeCountDiff =
        getEffectiveLikeCount(right.gameId) -
        getEffectiveLikeCount(left.gameId);

      if (likeCountDiff !== 0) {
        return likeCountDiff;
      }
    } else {
      const leftRating = left.rating ?? Number.NEGATIVE_INFINITY;
      const rightRating = right.rating ?? Number.NEGATIVE_INFINITY;
      const ratingDiff = rightRating - leftRating;

      if (ratingDiff !== 0) {
        return ratingDiff;
      }
    }

    return (
      (topGameOrderById.get(left.gameId) ?? Number.MAX_SAFE_INTEGER) -
      (topGameOrderById.get(right.gameId) ?? Number.MAX_SAFE_INTEGER)
    );
  });

const filterGames = ({
  search = '',
  genreId,
}: {
  search?: string;
  genreId?: number;
}) => {
  const normalizedSearch = normalizeSearchKeyword(search);
  const selectedGenre = getGenreFilterById(genreId);

  return getHydratedTopGames().filter((game) => {
    const matchesSearch =
      !normalizedSearch ||
      [game.name, ...game.genres].some((keyword) =>
        keyword.toLowerCase().includes(normalizedSearch),
      );
    const matchesGenre = selectedGenre
      ? matchesGenreFilter(game.genres, selectedGenre)
      : false;

    return matchesSearch && matchesGenre;
  });
};

export const getStoredTop100Games = ({ genreId }: { genreId?: number } = {}) =>
  filterGames({ genreId }).slice(0, 100);

export const searchStoredGames = ({
  search = '',
  genreId,
  sort = 'rating_desc',
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  genreId?: number;
  sort?: 'rating_desc' | 'like_desc' | 'created_at';
  page?: number;
  pageSize?: number;
}) => {
  const filteredGames = sortGames(filterGames({ search, genreId }), sort);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 20;
  const startIndex = (safePage - 1) * safePageSize;
  const results = filteredGames.slice(startIndex, startIndex + safePageSize);

  return {
    count: filteredGames.length,
    results,
  };
};

export const getStoredGameDetail = (gameId: number) => {
  const detail = ensureStoredDetail(gameId);

  return detail ? cloneGameDetail(detail) : null;
};

export const updateStoredGameLike = (
  gameId: number,
  isLiked: boolean,
): GameLikeResponse | null => {
  const detail = ensureStoredDetail(gameId);

  if (!detail) {
    return null;
  }

  const currentLiked = detail.isLiked === true;
  const likeCountAdjustment = currentLiked === isLiked ? 0 : isLiked ? 1 : -1;

  detail.isLiked = isLiked;
  detail.likeCount = Math.max(0, detail.likeCount + likeCountAdjustment);

  const topGame = getStoredTopGame(gameId);

  if (topGame) {
    topGame.isLiked = isLiked;
  }

  return {
    gameId,
    isLiked,
    likeCount: detail.likeCount,
  };
};
