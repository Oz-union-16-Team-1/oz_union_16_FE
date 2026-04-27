import type { InfiniteData, QueryClient } from '@tanstack/react-query';

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
): GameListItem =>
  item.gameId === update.gameId ? { ...item, isLiked: update.isLiked } : item;

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
