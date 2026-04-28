import { useMemo, useState } from 'react';

import { extractAuthApiErrorMessage } from '../../../features/auth/api/auth';
import {
  useLikedGamesQuery,
  useUnlikeLikedGameMutation,
} from '../../../features/auth/api/useAuthApi';
import type { GameListItem } from '../../../features/games/types';
import type { FavoriteGamePreview } from '../../../features/mypage/types';
import type { MyPageToastPayload } from '../types';
import { toFavoriteGameListItem, toFavoriteGamePreview } from '../utils';

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
  const likedGamesQuery = useLikedGamesQuery(enabled, {
    page_size: 20,
    page: 1,
  });
  const likedGamesData = likedGamesQuery.data;
  const unlikeLikedGameMutation = useUnlikeLikedGameMutation();
  const [selectedFavoriteGame, setSelectedFavoriteGame] =
    useState<FavoriteGamePreview | null>(null);
  const favoriteGames = useMemo(() => {
    return (likedGamesData?.results ?? []).map(toFavoriteGamePreview);
  }, [likedGamesData?.results]);
  const immediateFavoriteCount = likedGamesData?.count ?? favoriteGames.length;
  const refetchFavoriteGames = likedGamesQuery.refetch;
  const isFavoriteGamesLoading =
    likedGamesQuery.isLoading && !favoriteGames.length;
  const isFavoriteGamesError = likedGamesQuery.isError && !favoriteGames.length;

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
    favoriteGames,
    favoriteCount: immediateFavoriteCount,
    isFavoriteGamesLoading,
    isFavoriteGamesError,
    isFetchingFavoriteGames: likedGamesQuery.isFetching,
    selectedFavoriteGame,
    isUnlikePending: unlikeLikedGameMutation.isPending,
    setSelectedFavoriteGame,
    handleFavoriteGameCardClick,
    handleFavoriteGameDeleteConfirm,
    refetchFavoriteGames,
  };
}

export default useMyPageLikedGames;
