import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { authKeys } from '../auth/api/queryKeys';
import {
  applyLikeStateToLikedGamesResponse,
  isLikedGamesResponse,
} from '../auth/api/likedGamesCacheState';
import type { LikedGamesResponse } from '../auth/types/auth';
import type { LikeMutationCacheUpdate } from './queryCache.types';

const PRIMARY_LIKED_GAMES_PAGE_SIZE = 20;

const primaryLikedGamesQueryKey = authKeys.likedGamesList({
  page_size: PRIMARY_LIKED_GAMES_PAGE_SIZE,
});
const primaryInfiniteLikedGamesQueryKey = authKeys.likedGamesInfiniteList({
  page_size: PRIMARY_LIKED_GAMES_PAGE_SIZE,
});

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
