import type { QueryClient } from '@tanstack/react-query';

import {
  resetGameLikedStateInQueryCache,
  syncGameLikeStateInQueryCache,
} from './gameLikeCacheSync';
import { syncLikedGamesStateInQueryCache } from './likedGamesCacheSync';
import { gamesKeys } from './queryKeys';
import type { LikeMutationCacheUpdate } from './queryCache.types';

export {
  gamesKeys,
  resetGameLikedStateInQueryCache,
  syncGameLikeStateInQueryCache,
  syncLikedGamesStateInQueryCache,
};

export const syncLikeMutationStateInQueryCache = (
  queryClient: QueryClient,
  update: LikeMutationCacheUpdate,
) => {
  syncGameLikeStateInQueryCache(queryClient, update);
  syncLikedGamesStateInQueryCache(queryClient, update);
};
