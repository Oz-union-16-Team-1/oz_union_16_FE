import {
  GAME_GENRE_ID_MAP,
  matchesGenreFilter,
  type GameGenreFilter,
} from '../genres';
import { mockGameDetails } from '../mockGameDetails';
import { mockTopGames } from '../mockGames';
import { createSearchKeyword, type SearchKeyword } from '../search';
import type { GameDetail, GameListItem } from '../types';

const steamStoreUrl = (gameId: number) =>
  `https://store.steampowered.com/app/${gameId}`;

const genreIdToFilterMap = new Map<number, GameGenreFilter>(
  Object.entries(GAME_GENRE_ID_MAP).map(([genre, genreId]) => [
    genreId,
    genre as Exclude<GameGenreFilter, '전체'>,
  ]),
);

type StoredGameLikeState = {
  isLiked: boolean | null;
  likeCount: number;
};

type ResolveStoredGameLikeState = (
  gameId: number,
  fallback: StoredGameLikeState,
) => StoredGameLikeState;

const getFuzzySearchDistance = (value: string) => {
  if (value.length < 3) {
    return 0;
  }

  if (value.length < 7) {
    return 1;
  }

  return 2;
};

const getLevenshteinDistance = (
  source: string,
  target: string,
  maxDistance: number,
) => {
  const sourceLength = source.length;
  const targetLength = target.length;

  if (Math.abs(sourceLength - targetLength) > maxDistance) {
    return maxDistance + 1;
  }

  const previous = Array.from(
    { length: targetLength + 1 },
    (_, index) => index,
  );
  const current = new Array<number>(targetLength + 1).fill(0);

  for (let sourceIndex = 1; sourceIndex <= sourceLength; sourceIndex += 1) {
    current[0] = sourceIndex;
    let rowMin = current[0];

    for (let targetIndex = 1; targetIndex <= targetLength; targetIndex += 1) {
      const substitutionCost =
        source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;

      current[targetIndex] = Math.min(
        previous[targetIndex] + 1,
        current[targetIndex - 1] + 1,
        previous[targetIndex - 1] + substitutionCost,
      );

      rowMin = Math.min(rowMin, current[targetIndex]);
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[targetLength];
};

const includesFuzzyText = (
  haystack: string,
  needle: string,
  maxDistance: number,
) => {
  if (!needle) {
    return true;
  }

  if (!haystack || haystack.length < needle.length - maxDistance) {
    return false;
  }

  if (haystack.includes(needle)) {
    return true;
  }

  const minimumLength = Math.max(1, needle.length - maxDistance);
  const maximumLength = Math.min(haystack.length, needle.length + maxDistance);

  for (
    let candidateLength = minimumLength;
    candidateLength <= maximumLength;
    candidateLength += 1
  ) {
    for (
      let startIndex = 0;
      startIndex <= haystack.length - candidateLength;
      startIndex += 1
    ) {
      const candidate = haystack.slice(
        startIndex,
        startIndex + candidateLength,
      );

      if (
        getLevenshteinDistance(candidate, needle, maxDistance) <= maxDistance
      ) {
        return true;
      }
    }
  }

  return false;
};

const matchesSearchKeyword = (
  candidate: SearchKeyword,
  keyword: SearchKeyword,
  fuzzy: boolean,
) => {
  if (!keyword.normalized) {
    return true;
  }

  if (
    candidate.normalized.includes(keyword.normalized) ||
    candidate.collapsed.includes(keyword.collapsed) ||
    candidate.stripped.includes(keyword.stripped)
  ) {
    return true;
  }

  if (!fuzzy) {
    return false;
  }

  const fuzzySource = keyword.stripped || keyword.collapsed;
  const fuzzyTarget = candidate.stripped || candidate.collapsed;
  const maxDistance = getFuzzySearchDistance(fuzzySource);

  if (!fuzzySource || !fuzzyTarget || maxDistance === 0) {
    return false;
  }

  return includesFuzzyText(fuzzyTarget, fuzzySource, maxDistance);
};

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

const getStoredLikeFallback = (gameId: number): StoredGameLikeState => ({
  isLiked:
    ensureStoredDetail(gameId)?.isLiked ??
    getStoredTopGame(gameId)?.isLiked ??
    null,
  likeCount: ensureStoredDetail(gameId)?.likeCount ?? 0,
});

const getResolvedGameLikeState = (
  gameId: number,
  resolveStoredGameLikeState?: ResolveStoredGameLikeState,
) => {
  const fallback = getStoredLikeFallback(gameId);

  return resolveStoredGameLikeState
    ? resolveStoredGameLikeState(gameId, fallback)
    : fallback;
};

const getHydratedTopGames = (
  resolveStoredGameLikeState?: ResolveStoredGameLikeState,
) =>
  storedTopGames.map((game) => {
    const { isLiked } = getResolvedGameLikeState(
      game.gameId,
      resolveStoredGameLikeState,
    );

    return typeof isLiked === 'boolean' ? { ...game, isLiked } : { ...game };
  });

const sortGames = (
  games: GameListItem[],
  sort: 'rating_desc' | 'like_desc' | 'created_at',
  resolveStoredGameLikeState?: ResolveStoredGameLikeState,
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
        getResolvedGameLikeState(right.gameId, resolveStoredGameLikeState)
          .likeCount -
        getResolvedGameLikeState(left.gameId, resolveStoredGameLikeState)
          .likeCount;

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
  fuzzy = true,
  genreId,
  resolveStoredGameLikeState,
}: {
  search?: string;
  fuzzy?: boolean;
  genreId?: number;
  resolveStoredGameLikeState?: ResolveStoredGameLikeState;
}) => {
  const searchKeyword = createSearchKeyword(search);
  const selectedGenre = getGenreFilterById(genreId);

  return getHydratedTopGames(resolveStoredGameLikeState).filter((game) => {
    const matchesSearch =
      !searchKeyword.normalized ||
      matchesSearchKeyword(
        createSearchKeyword(game.name),
        searchKeyword,
        fuzzy,
      );
    const matchesGenre = selectedGenre
      ? matchesGenreFilter(game.genres, selectedGenre)
      : false;

    return matchesSearch && matchesGenre;
  });
};

export const getStoredTop100Games = ({
  genreId,
  resolveStoredGameLikeState,
}: {
  genreId?: number;
  resolveStoredGameLikeState?: ResolveStoredGameLikeState;
} = {}) => filterGames({ genreId, resolveStoredGameLikeState }).slice(0, 100);

export const searchStoredGames = ({
  search = '',
  fuzzy = true,
  genreId,
  sort = 'rating_desc',
  page = 1,
  pageSize = 20,
  resolveStoredGameLikeState,
}: {
  search?: string;
  fuzzy?: boolean;
  genreId?: number;
  sort?: 'rating_desc' | 'like_desc' | 'created_at';
  page?: number;
  pageSize?: number;
  resolveStoredGameLikeState?: ResolveStoredGameLikeState;
}) => {
  const filteredGames = sortGames(
    filterGames({ search, fuzzy, genreId, resolveStoredGameLikeState }),
    sort,
    resolveStoredGameLikeState,
  );
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

export const getStoredGameDetail = (
  gameId: number,
  resolveStoredGameLikeState?: ResolveStoredGameLikeState,
) => {
  const detail = ensureStoredDetail(gameId);

  if (!detail) {
    return null;
  }

  const resolvedLikeState = getResolvedGameLikeState(
    gameId,
    resolveStoredGameLikeState,
  );

  return {
    ...cloneGameDetail(detail),
    isLiked: resolvedLikeState.isLiked,
    likeCount: resolvedLikeState.likeCount,
  };
};
