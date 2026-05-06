import type { LikedGameCacheSeed } from '../auth/api/likedGamesCacheState';

export type GameLikeCacheUpdate = {
  gameId: number;
  isLiked: boolean;
  likeCount?: number;
};

export type LikeMutationCacheUpdate =
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
