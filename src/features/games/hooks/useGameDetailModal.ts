import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { useAuthStore } from '../../../store/useAuthStore';
import { authKeys } from '../../auth/api/queryKeys';
import type { LikedGamesResponse } from '../../auth/types/auth';
import {
  GAME_DETAIL_GC_TIME,
  GAME_DETAIL_STALE_TIME,
  mergeGameDetail,
} from '../detailUtils';
import { getGameDetail, likeGame, unlikeGame } from '../gameApi';
import { gamesKeys, syncGameLikeStateInQueryCache } from '../queryCache';
import type { GameDetail, GameLikeResponse, GameListItem } from '../types';

const LOGIN_REQUIRED_MESSAGE = '로그인 후 찜하기를 사용할 수 있어요.';
const LIKE_ERROR_MESSAGE =
  '찜하기 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const DETAIL_NOT_FOUND_MESSAGE = '해당 게임 상세 정보를 찾을 수 없습니다.';
const TOAST_DURATION_MS = 3000;

type GameDetailModalToast = {
  message: string;
  tone: 'error';
};

type DetailErrorKind = 'not-found' | 'error' | null;

const isLikedGamesResponse = (value: unknown): value is LikedGamesResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Array.isArray((value as Partial<LikedGamesResponse>).results);
};

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

const syncLikedGamesQueryCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  game: GameListItem,
  response: GameLikeResponse,
) => {
  queryClient.setQueriesData<LikedGamesResponse>(
    { queryKey: authKeys.likedGames() },
    (current) => {
      if (!isLikedGamesResponse(current)) {
        return current;
      }

      const currentLikedGames = current as LikedGamesResponse;

      if (response.isLiked) {
        const alreadyExists = currentLikedGames.results.some(
          (likedGame) => likedGame.game_id === response.gameId,
        );

        if (alreadyExists) {
          return current;
        }

        const detail =
          queryClient.getQueryData<GameDetail>(gamesKeys.detail(game.gameId)) ??
          null;

        const nextLikedGame = {
          game_id: response.gameId,
          game_title: detail?.title?.trim() || game.name.trim() || 'N/A',
          thumbnail_url: detail?.coverImageUrl ?? game.thumbnailUrl,
          genres: detail?.genres?.length ? detail.genres : game.genres,
          liked_at: new Date().toISOString(),
        };

        return {
          ...currentLikedGames,
          count: currentLikedGames.count + 1,
          results: [nextLikedGame, ...currentLikedGames.results],
        };
      }

      const nextResults = currentLikedGames.results.filter(
        (likedGame) => likedGame.game_id !== response.gameId,
      );

      if (nextResults.length === currentLikedGames.results.length) {
        return current;
      }

      return {
        ...currentLikedGames,
        count: Math.max(0, currentLikedGames.count - 1),
        results: nextResults,
      };
    },
  );
};

export const useGameDetailModal = (game: GameListItem) => {
  const accessToken = useAuthStore((state) => state.accessToken);
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
    retry: false,
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
      syncGameLikeStateInQueryCache(queryClient, nextLikeState);
      syncLikedGamesQueryCache(queryClient, game, response);
      void queryClient.invalidateQueries({
        queryKey: authKeys.likedGames(),
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
    isLikePending: likeMutation.isPending,
    isLiked,
    likeCount: Math.max(
      0,
      activeLikeState?.likeCount ?? detail?.likeCount ?? 0,
    ),
    likeLabel: isLiked ? '찜하기 취소' : '찜하기',
    toast,
  };
};
