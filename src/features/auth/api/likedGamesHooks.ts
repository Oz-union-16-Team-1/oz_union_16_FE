import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { syncLikeMutationStateInQueryCache } from '../../games/queryCache';
import { getLikedGames, unlikeLikedGame } from './auth';
import { authKeys } from './queryKeys';
import type { LikedGamesRequest } from '../types/auth';

const LIKED_GAMES_PAGE_SIZE = 20;

export const useLikedGamesQuery = (
  enabled = true,
  payload: LikedGamesRequest = {},
) =>
  useQuery({
    queryKey: authKeys.likedGamesList(payload),
    queryFn: () => getLikedGames(payload),
    enabled,
    staleTime: 60_000,
  });

export const useInfiniteLikedGamesQuery = (
  enabled = true,
  payload: LikedGamesRequest = {},
) => {
  const pageSize = payload.page_size ?? LIKED_GAMES_PAGE_SIZE;
  const initialPage = payload.page ?? 1;

  return useInfiniteQuery({
    queryKey: authKeys.likedGamesInfiniteList({
      page_size: pageSize,
    }),
    queryFn: ({ pageParam }) =>
      getLikedGames({
        ...payload,
        page: pageParam,
        page_size: pageSize,
      }),
    initialPageParam: initialPage,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (totalCount, page) =>
          totalCount + (Array.isArray(page.results) ? page.results.length : 0),
        0,
      );
      const totalCount =
        typeof lastPage.count === 'number' ? lastPage.count : loadedCount;

      return loadedCount < totalCount
        ? initialPage + allPages.length
        : undefined;
    },
    enabled,
    staleTime: 60_000,
  });
};

export const useUnlikeLikedGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: authKeys.unlikeLikedGame(),
    mutationFn: unlikeLikedGame,
    onSuccess: (_, gameId) => {
      syncLikeMutationStateInQueryCache(queryClient, {
        gameId,
        isLiked: false,
      });
    },
  });
};
