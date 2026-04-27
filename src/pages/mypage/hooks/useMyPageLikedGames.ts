import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { extractAuthApiErrorMessage } from '../../../features/auth/api/auth';
import {
  DEFAULT_LIKED_GAMES_PAGE_SIZE,
  useLikedGamesInfiniteQuery,
  useUnlikeLikedGameMutation,
} from '../../../features/auth/api/useAuthApi';
import { authKeys } from '../../../features/auth/api/queryKeys';
import type { GameListItem } from '../../../features/games/types';
import type { FavoriteGamePreview } from '../../../features/mypage/types';
import type {
  LikedGameItemResponse,
  LikedGamesResponse,
} from '../../../features/auth/types/auth';
import type { MyPageToastPayload } from '../types';
import { toFavoriteGameListItem, toFavoriteGamePreview } from '../utils';
import { getPaginatedResults } from '../../../utils/paginatedResults';

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
  const likedGamesQuery = useLikedGamesInfiniteQuery(
    enabled,
    DEFAULT_LIKED_GAMES_PAGE_SIZE,
  );
  const unlikeLikedGameMutation = useUnlikeLikedGameMutation();
  const [selectedFavoriteGame, setSelectedFavoriteGame] =
    useState<FavoriteGamePreview | null>(null);
  const favoriteGamesScrollRef = useRef<HTMLDivElement | null>(null);
  const favoriteGamesLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const cachedLikedGamesData = queryClient.getQueryData<
    InfiniteData<LikedGamesResponse>
  >(
    authKeys.likedGamesInfinite({
      page_size: DEFAULT_LIKED_GAMES_PAGE_SIZE,
    }),
  );
  const resolvedLikedGamesData = likedGamesQuery.data ?? cachedLikedGamesData;
  const likedGameResults = useMemo(() => {
    const pages = resolvedLikedGamesData?.pages ?? [];

    return pages.flatMap((page) => getPaginatedResults(page));
  }, [resolvedLikedGamesData]);
  const favoriteGames = useMemo(() => {
    const deduplicatedGames = new Map<number, LikedGameItemResponse>();

    likedGameResults.forEach((game) => {
      deduplicatedGames.set(game.game_id, game);
    });

    return [...deduplicatedGames.values()].map(toFavoriteGamePreview);
  }, [likedGameResults]);
  const immediateFavoriteCount =
    resolvedLikedGamesData?.pages?.[0]?.count ?? favoriteGames.length;
  const hasFavoriteGamesNextPage = Boolean(likedGamesQuery.hasNextPage);
  const isFavoriteGamesFetchNextPageError =
    likedGamesQuery.isFetchNextPageError;
  const isFavoriteGamesFetchingNextPage = likedGamesQuery.isFetchingNextPage;
  const fetchNextFavoriteGamesPage = likedGamesQuery.fetchNextPage;
  const refetchFavoriteGames = likedGamesQuery.refetch;
  const isFavoriteGamesLoading =
    likedGamesQuery.isLoading && !favoriteGames.length;
  const isFavoriteGamesError = likedGamesQuery.isError && !favoriteGames.length;

  useEffect(() => {
    if (isFavoriteGamesFetchNextPageError || !hasFavoriteGamesNextPage) {
      return undefined;
    }

    const rootElement = favoriteGamesScrollRef.current;
    const targetElement = favoriteGamesLoadMoreRef.current;

    if (!rootElement || !targetElement) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting || isFavoriteGamesFetchingNextPage) {
          return;
        }

        void fetchNextFavoriteGamesPage();
      },
      {
        root: rootElement,
        rootMargin: '0px 280px 0px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [
    hasFavoriteGamesNextPage,
    isFavoriteGamesFetchNextPageError,
    isFavoriteGamesFetchingNextPage,
    fetchNextFavoriteGamesPage,
  ]);

  const handleFavoriteGameCardClick = (game: FavoriteGamePreview) => {
    onOpenGameDetail(toFavoriteGameListItem(game));
  };

  const handleFavoriteGameDeleteConfirm = async () => {
    if (!selectedFavoriteGame) {
      return;
    }

    try {
      const response = await unlikeLikedGameMutation.mutateAsync(
        selectedFavoriteGame.gameId,
      );

      setSelectedFavoriteGame(null);
      onToast({
        tone: 'success',
        message: response.detail || '찜한 게임이 목록에서 삭제되었습니다.',
      });
    } catch (error) {
      onToast({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
    }
  };

  return {
    favoriteGamesScrollRef,
    favoriteGamesLoadMoreRef,
    favoriteGames,
    favoriteCount: immediateFavoriteCount,
    isFavoriteGamesLoading,
    isFavoriteGamesError,
    hasFavoriteGamesNextPage,
    isFavoriteGamesFetchingNextPage,
    isFavoriteGamesFetchNextPageError,
    isFetchingFavoriteGames:
      likedGamesQuery.isFetching || likedGamesQuery.isFetchingNextPage,
    selectedFavoriteGame,
    isUnlikePending: unlikeLikedGameMutation.isPending,
    setSelectedFavoriteGame,
    handleFavoriteGameCardClick,
    handleFavoriteGameDeleteConfirm,
    refetchFavoriteGames,
    fetchNextFavoriteGamesPage,
  };
}

export default useMyPageLikedGames;
