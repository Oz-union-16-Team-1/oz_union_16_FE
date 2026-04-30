import { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';

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
  const serverFavoriteGames = useMemo(() => {
    return (likedGamesData?.results ?? []).map(toFavoriteGamePreview);
  }, [likedGamesData?.results]);
  const [favoriteGames, setFavoriteGames] = useState<FavoriteGamePreview[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    setFavoriteGames(serverFavoriteGames);
  }, [serverFavoriteGames]);

  useEffect(() => {
    setFavoriteCount(likedGamesData?.count ?? serverFavoriteGames.length);
  }, [likedGamesData?.count, serverFavoriteGames.length]);

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

    const targetGameId = selectedFavoriteGame.gameId;

    if (!Number.isInteger(targetGameId) || targetGameId <= 0) {
      onToast({
        tone: 'error',
        message:
          '삭제할 게임 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }

    const removeFavoriteGameFromState = () => {
      const isVisibleTarget = favoriteGames.some(
        (game) => game.gameId === targetGameId,
      );

      if (!isVisibleTarget) {
        return;
      }

      setFavoriteGames((current) =>
        current.filter((game) => game.gameId !== targetGameId),
      );
      setFavoriteCount((current) => Math.max(0, current - 1));
    };

    try {
      await unlikeLikedGameMutation.mutateAsync(targetGameId);
      removeFavoriteGameFromState();
      setSelectedFavoriteGame(null);
      onToast({
        tone: 'success',
        message: '찜한 목록에서 삭제되었습니다.',
      });
      void refetchFavoriteGames();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        removeFavoriteGameFromState();
        setSelectedFavoriteGame(null);
        onToast({
          tone: 'success',
          message: '이미 삭제된 게임입니다.',
        });
        void refetchFavoriteGames();
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
