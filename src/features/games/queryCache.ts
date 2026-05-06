import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { authKeys } from '../auth/api/queryKeys';
import {
  applyLikeStateToLikedGamesResponse,
  isLikedGamesResponse,
  type LikedGameCacheSeed,
} from '../auth/api/likedGamesCacheState';
import type { LikedGamesResponse } from '../auth/types/auth';
import type { GameGenreFilter } from './genres';
import type { GameDetail, GameListItem, SearchGamesResult } from './types';
import type { MatchingCandidatesResponse } from '../matching/types';

const gamesRootKey = ['games'] as const;
const gamesTop100RootKey = [...gamesRootKey, 'top100'] as const;
const gamesSearchRootKey = [...gamesRootKey, 'search'] as const;

export const gamesKeys = {
  all: gamesRootKey,
  top100Root: () => gamesTop100RootKey,
  top100: (genre: GameGenreFilter) => [...gamesTop100RootKey, genre] as const,
  searchRoot: () => gamesSearchRootKey,
  search: (searchText: string, genre: GameGenreFilter) =>
    [...gamesSearchRootKey, searchText, genre] as const,
  detail: (gameId: number) => [...gamesRootKey, 'detail', gameId] as const,
};

type GameLikeCacheUpdate = {
  gameId: number;
  isLiked: boolean;
  likeCount?: number;
};

type LikeMutationCacheUpdate =
  | {
      gameId: number;
      isLiked: true;
      likeCount?: number;
      likedGame: LikedGameCacheSeed;
    }
  | {
      gameId: number;
      isLiked: false;
      likeCount?: number;
      likedGame?: LikedGameCacheSeed;
    };

const PRIMARY_LIKED_GAMES_PAGE_SIZE = 20;

type LikeableResultPage = {
  results: Array<{
    game_id: number;
    is_liked: boolean;
  }>;
};

const getNextLikeCount = (
  currentLikeCount: number,
  currentIsLiked: boolean | null,
  update: GameLikeCacheUpdate,
) => {
  if (typeof update.likeCount === 'number') {
    return update.likeCount;
  }

  if (currentIsLiked === update.isLiked) {
    return currentLikeCount;
  }

  return Math.max(0, currentLikeCount + (update.isLiked ? 1 : -1));
};

const updateGameListItem = (
  item: GameListItem,
  update: GameLikeCacheUpdate,
): GameListItem => {
  if (item.gameId !== update.gameId) {
    return item;
  }

  const nextLikeCount =
    typeof item.likeCount === 'number' || typeof update.likeCount === 'number'
      ? getNextLikeCount(item.likeCount ?? 0, item.isLiked ?? null, update)
      : item.likeCount;

  return {
    ...item,
    isLiked: update.isLiked,
    likeCount: nextLikeCount,
  };
};

const primaryLikedGamesQueryKey = authKeys.likedGamesList({
  page_size: PRIMARY_LIKED_GAMES_PAGE_SIZE,
});
const primaryInfiniteLikedGamesQueryKey = authKeys.likedGamesInfiniteList({
  page_size: PRIMARY_LIKED_GAMES_PAGE_SIZE,
});

export const syncGameLikeStateInQueryCache = (
  queryClient: QueryClient,
  update: GameLikeCacheUpdate,
) => {
  queryClient.setQueryData<GameDetail>(
    gamesKeys.detail(update.gameId),
    (currentDetail) =>
      currentDetail
        ? {
            ...currentDetail,
            isLiked: update.isLiked,
            likeCount: getNextLikeCount(
              currentDetail.likeCount,
              currentDetail.isLiked,
              update,
            ),
          }
        : currentDetail,
  );

  queryClient.setQueriesData<GameListItem[]>(
    { queryKey: gamesKeys.top100Root() },
    (currentGames) =>
      Array.isArray(currentGames)
        ? currentGames.map((game) => updateGameListItem(game, update))
        : currentGames,
  );

  queryClient.setQueriesData<InfiniteData<SearchGamesResult>>(
    { queryKey: gamesKeys.searchRoot() },
    (currentData) =>
      currentData && Array.isArray(currentData.pages)
        ? {
            ...currentData,
            pages: currentData.pages.map((page) => ({
              ...page,
              results: page.results.map((game) =>
                updateGameListItem(game, update),
              ),
            })),
          }
        : currentData,
  );

  const updateRecommendationPages = <TPage extends LikeableResultPage>(
    currentData: InfiniteData<TPage> | undefined,
  ) =>
    currentData && Array.isArray(currentData.pages)
      ? {
          ...currentData,
          pages: currentData.pages.map((page) => ({
            ...page,
            results: page.results.map((result) =>
              result.game_id === update.gameId
                ? { ...result, is_liked: update.isLiked }
                : result,
            ),
          })),
        }
      : currentData;

  queryClient.setQueriesData<InfiniteData<LikeableResultPage>>(
    { queryKey: ['survey-results'] },
    updateRecommendationPages,
  );
  queryClient.setQueriesData<InfiniteData<LikeableResultPage>>(
    { queryKey: ['match-results'] },
    updateRecommendationPages,
  );

  queryClient.setQueriesData<MatchingCandidatesResponse>(
    { queryKey: ['match-candidates'] },
    (currentData) =>
      currentData && Array.isArray(currentData.results)
        ? {
            ...currentData,
            results: currentData.results.map((result) =>
              result.game_id === update.gameId
                ? { ...result, is_liked: update.isLiked }
                : result,
            ),
          }
        : currentData,
  );
};

export const syncLikedGamesStateInQueryCache = (
  queryClient: QueryClient,
  update: LikeMutationCacheUpdate,
) => {
  const likedGameSeed = update.likedGame ?? {
    gameId: update.gameId,
  };

  queryClient.setQueryData<LikedGamesResponse>(
    primaryLikedGamesQueryKey,
    (currentLikedGames) => {
      if (!isLikedGamesResponse(currentLikedGames)) {
        return currentLikedGames;
      }

      return applyLikeStateToLikedGamesResponse(currentLikedGames, {
        isLiked: update.isLiked,
        seed: likedGameSeed,
      });
    },
  );

  queryClient.setQueryData<InfiniteData<LikedGamesResponse>>(
    primaryInfiniteLikedGamesQueryKey,
    (currentLikedGames) => {
      if (!currentLikedGames || !Array.isArray(currentLikedGames.pages)) {
        return currentLikedGames;
      }

      const hasLoadedGame = currentLikedGames.pages.some((page) =>
        page.results.some((likedGame) => likedGame.game_id === update.gameId),
      );

      return {
        ...currentLikedGames,
        pages: currentLikedGames.pages.map((page, pageIndex) => {
          if (!isLikedGamesResponse(page)) {
            return page;
          }

          if (update.isLiked) {
            const nextCount = hasLoadedGame ? page.count : page.count + 1;

            if (pageIndex > 0 || hasLoadedGame) {
              return {
                ...page,
                count: nextCount,
              };
            }

            return {
              ...applyLikeStateToLikedGamesResponse(page, {
                isLiked: true,
                seed: likedGameSeed,
              }),
              count: nextCount,
            };
          }

          return {
            ...page,
            count: Math.max(0, page.count - 1),
            results: page.results.filter(
              (likedGame) => likedGame.game_id !== update.gameId,
            ),
          };
        }),
      };
    },
  );
};

export const syncLikeMutationStateInQueryCache = (
  queryClient: QueryClient,
  update: LikeMutationCacheUpdate,
) => {
  syncGameLikeStateInQueryCache(queryClient, update);
  syncLikedGamesStateInQueryCache(queryClient, update);
};
