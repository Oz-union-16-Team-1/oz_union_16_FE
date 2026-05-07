import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { MatchingCandidatesResponse } from '../matching/types';
import { gamesKeys } from './queryKeys';
import type { GameLikeCacheUpdate } from './queryCache.types';
import type { GameDetail, GameListItem, SearchGamesResult } from './types';

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

const updateRecommendationPages = <TPage extends LikeableResultPage>(
  currentData: InfiniteData<TPage> | undefined,
  update: GameLikeCacheUpdate,
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

const resetGameListItemLikedState = (item: GameListItem): GameListItem => ({
  ...item,
  isLiked: false,
});

const resetRecommendationPagesLikedState = <TPage extends LikeableResultPage>(
  currentData: InfiniteData<TPage> | undefined,
) =>
  currentData && Array.isArray(currentData.pages)
    ? {
        ...currentData,
        pages: currentData.pages.map((page) => ({
          ...page,
          results: page.results.map((result) => ({
            ...result,
            is_liked: false,
          })),
        })),
      }
    : currentData;

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

  queryClient.setQueriesData<InfiniteData<LikeableResultPage>>(
    { queryKey: ['survey-results'] },
    (currentData) => updateRecommendationPages(currentData, update),
  );
  queryClient.setQueriesData<InfiniteData<LikeableResultPage>>(
    { queryKey: ['match-results'] },
    (currentData) => updateRecommendationPages(currentData, update),
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

export const resetGameLikedStateInQueryCache = (queryClient: QueryClient) => {
  queryClient.setQueriesData<GameDetail>(
    { queryKey: [gamesKeys.all[0], 'detail'] },
    (currentDetail) =>
      currentDetail
        ? {
            ...currentDetail,
            isLiked: false,
          }
        : currentDetail,
  );

  queryClient.setQueriesData<GameListItem[]>(
    { queryKey: gamesKeys.top100Root() },
    (currentGames) =>
      Array.isArray(currentGames)
        ? currentGames.map(resetGameListItemLikedState)
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
              results: page.results.map(resetGameListItemLikedState),
            })),
          }
        : currentData,
  );

  queryClient.setQueriesData<InfiniteData<LikeableResultPage>>(
    { queryKey: ['survey-results'] },
    (currentData) => resetRecommendationPagesLikedState(currentData),
  );
  queryClient.setQueriesData<InfiniteData<LikeableResultPage>>(
    { queryKey: ['match-results'] },
    (currentData) => resetRecommendationPagesLikedState(currentData),
  );

  queryClient.setQueriesData<MatchingCandidatesResponse>(
    { queryKey: ['match-candidates'] },
    (currentData) =>
      currentData && Array.isArray(currentData.results)
        ? {
            ...currentData,
            results: currentData.results.map((result) => ({
              ...result,
              is_liked: false,
            })),
          }
        : currentData,
  );
};
