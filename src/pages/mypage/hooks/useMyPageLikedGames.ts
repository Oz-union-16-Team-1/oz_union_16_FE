import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useMemo, useState } from 'react';

import { extractAuthApiErrorMessage } from '../../../features/auth/api/auth';
import { authKeys } from '../../../features/auth/api/queryKeys';
import {
  useInfiniteLikedGamesQuery,
  useUnlikeLikedGameMutation,
} from '../../../features/auth/api/useAuthApi';
import type { LikedGamesResponse } from '../../../features/auth/types/auth';
import type { GameListItem } from '../../../features/games/types';
import { syncLikedGamesStateInQueryCache } from '../../../features/games/queryCache';
import { normalizeThumbnailUrl } from '../../../lib/normalizeThumbnailUrl';
import type { FavoriteGamePreview, MyPageToastPayload } from '../types';
import {
  toDisplayText,
  toFavoriteGameListItem,
  toFavoriteGamePreview,
  toStringList,
} from '../utils';

const LIKED_GAMES_PAGE_SIZE = 20;

type UseMyPageLikedGamesOptions = {
  enabled: boolean;
  onOpenGameDetail: (game: GameListItem) => void;
  onToast: (toast: MyPageToastPayload) => void;
};

function useMyPageLikedGames({
  enabled,
  onOpenGameDetail,
  onToast,
}: UseMyPageLikedGamesOptions) {
  const queryClient = useQueryClient();
  const likedGamesQuery = useInfiniteLikedGamesQuery(enabled, {
    page_size: LIKED_GAMES_PAGE_SIZE,
    page: 1,
  });
  const likedGamesData = likedGamesQuery.data;
  const unlikeLikedGameMutation = useUnlikeLikedGameMutation();
  const [selectedFavoriteGame, setSelectedFavoriteGame] =
    useState<FavoriteGamePreview | null>(null);
  const [favoriteListRenderVersion, setFavoriteListRenderVersion] = useState(0);
  const likedGamesResults = useMemo(
    () =>
      likedGamesData?.pages.flatMap((page) =>
        Array.isArray(page.results) ? page.results : [],
      ) ?? [],
    [likedGamesData],
  );
  const serverFavoriteGames = useMemo(() => {
    return likedGamesResults
      .map(toFavoriteGamePreview)
      .filter((game) => game.gameId > 0);
  }, [likedGamesResults]);

  const favoriteGames = serverFavoriteGames;
  const favoriteCount =
    likedGamesData?.pages.reduce(
      (currentCount, page) =>
        typeof page.count === 'number' ? page.count : currentCount,
      serverFavoriteGames.length,
    ) ?? serverFavoriteGames.length;

  const refetchFavoriteGames = likedGamesQuery.refetch;
  const isFavoriteGamesLoading =
    likedGamesQuery.isLoading && !favoriteGames.length;
  const isFavoriteGamesError = likedGamesQuery.isError && !favoriteGames.length;

  const handleFavoriteGameCardClick = (game: FavoriteGamePreview) => {
    onOpenGameDetail(toFavoriteGameListItem(game));
  };

  const refetchFavoriteGamesWithPreservedThumbnails = async (
    previousLikedGames: LikedGamesResponse['results'],
  ) => {
    try {
      const refetchResult = await refetchFavoriteGames();
      const nextLikedGames = refetchResult.data;

      if (!nextLikedGames) {
        return;
      }

      const previousLikedGameMap = new Map(
        previousLikedGames.map((game) => [game.game_id, game]),
      );

      queryClient.setQueryData(
        authKeys.likedGamesInfiniteList({
          page_size: LIKED_GAMES_PAGE_SIZE,
        }),
        {
          ...nextLikedGames,
          pages: nextLikedGames.pages.map((page) => {
            const nextLikedGamesResults = Array.isArray(page.results)
              ? page.results
              : [];
            const nextResults = nextLikedGamesResults.map((game) => {
              const previousGame = previousLikedGameMap.get(game.game_id);
              const normalizedGenres = toStringList(game.genres);
              const previousGenres = toStringList(previousGame?.genres);

              return {
                ...game,
                game_title: toDisplayText(
                  game.game_title,
                  toDisplayText(previousGame?.game_title),
                ),
                thumbnail_url:
                  normalizeThumbnailUrl(game.thumbnail_url) ??
                  normalizeThumbnailUrl(previousGame?.thumbnail_url) ??
                  null,
                genres:
                  normalizedGenres.length > 0
                    ? normalizedGenres
                    : previousGenres,
              };
            });

            return {
              ...page,
              count:
                typeof page.count === 'number'
                  ? page.count
                  : nextResults.length,
              results: nextResults,
            };
          }),
        },
      );
    } catch {
      void queryClient.invalidateQueries({
        queryKey: authKeys.likedGamesInfiniteList({
          page_size: LIKED_GAMES_PAGE_SIZE,
        }),
      });
    }
  };

  const handleFavoriteGameDeleteConfirm = async () => {
    if (!selectedFavoriteGame) {
      return;
    }

    const targetGameId = selectedFavoriteGame.gameId;

    if (!Number.isInteger(targetGameId) || targetGameId <= 0) {
      onToast({
        tone: 'error',
        message:
          '삭제할 게임 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }

    const previousLikedGames = likedGamesResults;

    try {
      await unlikeLikedGameMutation.mutateAsync(targetGameId);
      setFavoriteListRenderVersion((current) => current + 1);
      setSelectedFavoriteGame(null);
      onToast({
        tone: 'success',
        message: '찜한 목록에서 삭제되었습니다.',
      });
      void refetchFavoriteGamesWithPreservedThumbnails(previousLikedGames);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        syncLikedGamesStateInQueryCache(queryClient, {
          gameId: targetGameId,
          isLiked: false,
        });
        setFavoriteListRenderVersion((current) => current + 1);
        setSelectedFavoriteGame(null);
        onToast({
          tone: 'success',
          message: '이미 삭제된 게임입니다.',
        });
        void refetchFavoriteGamesWithPreservedThumbnails(previousLikedGames);
        return;
      }

      onToast({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
    }
  };

  return {
    favoriteGames,
    favoriteCount,
    favoriteListRenderVersion,
    isFavoriteGamesLoading,
    isFavoriteGamesError,
    isFetchingFavoriteGames: likedGamesQuery.isFetching,
    isFetchingMoreFavoriteGames: likedGamesQuery.isFetchingNextPage,
    hasMoreFavoriteGames: Boolean(likedGamesQuery.hasNextPage),
    loadedFavoriteGamesCount: favoriteGames.length,
    selectedFavoriteGame,
    isUnlikePending: unlikeLikedGameMutation.isPending,
    setSelectedFavoriteGame,
    handleFavoriteGameCardClick,
    handleFavoriteGameDeleteConfirm,
    loadMoreFavoriteGames: likedGamesQuery.fetchNextPage,
    refetchFavoriteGames,
  };
}

export default useMyPageLikedGames;
