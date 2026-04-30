import { AxiosError } from 'axios';
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
  const [locallyRemovedGameIds, setLocallyRemovedGameIds] = useState<number[]>(
    [],
  );
  const serverFavoriteGames = useMemo(() => {
    return (likedGamesData?.results ?? []).map(toFavoriteGamePreview);
  }, [likedGamesData?.results]);
  const hiddenGameIdSet = useMemo(
    () => new Set(locallyRemovedGameIds),
    [locallyRemovedGameIds],
  );
  const favoriteGames = useMemo(
    () =>
      serverFavoriteGames.filter((game) => !hiddenGameIdSet.has(game.gameId)),
    [hiddenGameIdSet, serverFavoriteGames],
  );
  const favoriteCount = useMemo(() => {
    const hiddenCount = serverFavoriteGames.reduce(
      (count, game) => count + Number(hiddenGameIdSet.has(game.gameId)),
      0,
    );
    const serverCount = likedGamesData?.count ?? serverFavoriteGames.length;

    return Math.max(0, serverCount - hiddenCount);
  }, [hiddenGameIdSet, likedGamesData?.count, serverFavoriteGames]);

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

    const hideFavoriteGame = () => {
      setLocallyRemovedGameIds((current) =>
        current.includes(targetGameId) ? current : [...current, targetGameId],
      );
    };
    const syncRemovedGamesAfterRefetch = async () => {
      const refetchResult = await refetchFavoriteGames();
      const nextVisibleGameIds = new Set(
        (refetchResult.data?.results ?? []).map((game) => game.game_id),
      );

      setLocallyRemovedGameIds((current) =>
        current.filter((gameId) => nextVisibleGameIds.has(gameId)),
      );
    };

    try {
      await unlikeLikedGameMutation.mutateAsync(targetGameId);
      hideFavoriteGame();
      setSelectedFavoriteGame(null);
      onToast({
        tone: 'success',
        message: '찜한 목록에서 삭제되었습니다.',
      });
      void syncRemovedGamesAfterRefetch();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        hideFavoriteGame();
        setSelectedFavoriteGame(null);
        onToast({
          tone: 'success',
          message: '이미 삭제된 게임입니다.',
        });
        void syncRemovedGamesAfterRefetch();
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
