import type { QueryClient } from '@tanstack/react-query';

import { syncGameLikeStateInQueryCache } from './gameLikeCacheSync';
import { syncLikedGamesStateInQueryCache } from './likedGamesCacheSync';
import { gamesKeys } from './queryKeys';
import type { LikeMutationCacheUpdate } from './queryCache.types';

export {
  gamesKeys,
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
