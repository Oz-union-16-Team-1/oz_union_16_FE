import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { useAuthStore } from '../../../store/useAuthStore';
import { shouldRetryApiQuery } from '../../../api/queryRetry';
import useAuthSessionState from '../../auth/hooks/useAuthSessionState';
import {
  GAME_DETAIL_GC_TIME,
  GAME_DETAIL_STALE_TIME,
  mergeGameDetail,
} from '../detailUtils';
import { getGameDetail, likeGame, unlikeGame } from '../gameApi';
import { gamesKeys, syncLikeMutationStateInQueryCache } from '../queryCache';
import type { GameDetail, GameListItem } from '../types';

const LOGIN_REQUIRED_MESSAGE = '로그인 후 찜하기를 사용할 수 있어요.';
const AUTH_CHECK_PENDING_MESSAGE =
  '로그인 상태를 확인하고 있어요. 잠시만 기다려 주세요.';
const LIKE_ERROR_MESSAGE =
  '찜하기 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const DETAIL_NOT_FOUND_MESSAGE = '해당 게임 상세 정보를 찾을 수 없습니다.';
const TOAST_DURATION_MS = 3000;

type GameDetailModalToast = {
  message: string;
  tone: 'error';
};

type DetailErrorKind = 'not-found' | 'error' | null;

const getLikeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return LOGIN_REQUIRED_MESSAGE;
    }

    if (error.response?.status === 404) {
      return DETAIL_NOT_FOUND_MESSAGE;
    }
  }

  return LIKE_ERROR_MESSAGE;
};

const getDetailErrorKind = (error: unknown): DetailErrorKind => {
  if (!(error instanceof AxiosError)) {
    return error ? 'error' : null;
  }

  if (error.response?.status === 404) {
    return 'not-found';
  }

  return 'error';
};

export const useGameDetailModal = (game: GameListItem) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { isAuthLoading } = useAuthSessionState();
  const queryClient = useQueryClient();
  const [likeState, setLikeState] = useState<{
    gameId: number;
    isLiked: boolean | null;
    likeCount: number;
  } | null>(null);
  const [toast, setToast] = useState<GameDetailModalToast | null>(null);

  const detailQuery = useQuery({
    queryKey: gamesKeys.detail(game.gameId),
    queryFn: async () => {
      const incomingDetail = await getGameDetail(game.gameId);
      const previousDetail =
        queryClient.getQueryData<GameDetail>(gamesKeys.detail(game.gameId)) ??
        null;

      return mergeGameDetail(previousDetail, incomingDetail);
    },
    staleTime: GAME_DETAIL_STALE_TIME,
    gcTime: GAME_DETAIL_GC_TIME,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: shouldRetryApiQuery,
  });

  const detail = detailQuery.data;
  const detailErrorKind = getDetailErrorKind(detailQuery.error);
  const hasFallbackSummary = Boolean(
    game.name.trim() ||
    game.thumbnailUrl ||
    game.genres.length > 0 ||
    typeof game.rating === 'number' ||
    typeof game.isLiked === 'boolean',
  );
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
  const isLikeInteractionDisabled = isAuthLoading || likeMutation.isPending;

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
    canRenderFallbackSummary: hasFallbackSummary,
    clearToast: () => setToast(null),
    detail,
    detailErrorKind,
    detailQuery,
    handleToggleLike,
    hasResolvedDetail: Boolean(detail),
    isLikeInteractionDisabled,
    isLiked,
    likeCount: Math.max(
      0,
      activeLikeState?.likeCount ?? detail?.likeCount ?? 0,
    ),
    likeLabel: isLiked ? '찜하기 취소' : '찜하기',
    toast,
  };
};
