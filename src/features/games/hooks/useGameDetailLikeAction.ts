import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAuthStore } from '../../../store/useAuthStore';
import useAuthSessionState from '../../auth/hooks/useAuthSessionState';
import { getToggleLikeErrorMessage } from '../likeError';
import { likeGame, unlikeGame } from '../gameApi';
import { syncLikeMutationStateInQueryCache } from '../queryCache';
import type { GameDetail, GameListItem } from '../types';

const LOGIN_REQUIRED_MESSAGE = '로그인 후 찜하기를 사용할 수 있어요.';
const AUTH_CHECK_PENDING_MESSAGE =
  '로그인 상태를 확인하고 있어요. 잠시만 기다려 주세요.';
const LIKE_ERROR_MESSAGE =
  '찜하기 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const DETAIL_NOT_FOUND_MESSAGE = '해당 게임 상세 정보를 찾을 수 없습니다.';
const TOAST_DURATION_MS = 3000;

export type GameDetailModalToast = {
  message: string;
  tone: 'error';
};

const getLikeErrorMessage = (error: unknown) => {
  return getToggleLikeErrorMessage(error, {
    loginRequired: LOGIN_REQUIRED_MESSAGE,
    defaultError: LIKE_ERROR_MESSAGE,
    notFound: DETAIL_NOT_FOUND_MESSAGE,
  });
};

export const useGameDetailLikeAction = ({
  game,
  detail,
}: {
  game: GameListItem;
  detail: GameDetail | undefined;
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { isAuthLoading } = useAuthSessionState();
  const queryClient = useQueryClient();
  const [likeState, setLikeState] = useState<{
    gameId: number;
    isLiked: boolean | null;
    likeCount: number;
  } | null>(null);
  const [toast, setToast] = useState<GameDetailModalToast | null>(null);

  const activeLikeState = likeState?.gameId === game.gameId ? likeState : null;
  const currentLiked =
    activeLikeState?.isLiked ??
    detail?.isLiked ??
    (typeof game.isLiked === 'boolean' ? game.isLiked : null);
  const isLiked = currentLiked === true;

  const likeMutation = useMutation({
    mutationFn: (nextLiked: boolean) =>
      nextLiked ? likeGame(game.gameId) : unlikeGame(game.gameId),
    onMutate: () => {
      setToast(null);
    },
    onSuccess: (response) => {
      const nextLikeState = {
        gameId: response.gameId,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
      };

      setLikeState(nextLikeState);
      syncLikeMutationStateInQueryCache(queryClient, {
        ...nextLikeState,
        likedGame: {
          gameId: response.gameId,
          title: detail?.title ?? game.name,
          thumbnailUrl: detail?.coverImageUrl ?? game.thumbnailUrl,
          genres: detail?.genres?.length ? detail.genres : game.genres,
        },
      });
    },
    onError: (error) => {
      setToast({
        message: getLikeErrorMessage(error),
        tone: 'error',
      });
    },
  });

  const handleToggleLike = () => {
    if (isAuthLoading) {
      setToast({
        message: AUTH_CHECK_PENDING_MESSAGE,
        tone: 'error',
      });
      return;
    }

    if (!accessToken) {
      setToast({
        message: LOGIN_REQUIRED_MESSAGE,
        tone: 'error',
      });
      return;
    }

    likeMutation.mutate(!isLiked);
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  return {
    clearToast: () => setToast(null),
    handleToggleLike,
    isLikeInteractionDisabled: isAuthLoading || likeMutation.isPending,
    isLiked,
    likeCount: Math.max(
      0,
      activeLikeState?.likeCount ?? detail?.likeCount ?? 0,
    ),
    likeLabel: isLiked ? '찜하기 취소' : '찜하기',
    toast,
  };
};
