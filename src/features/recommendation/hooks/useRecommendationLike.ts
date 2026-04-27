import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { authKeys } from '../../auth/api/queryKeys';
import type { LikedGamesResponse } from '../../auth/types/auth';
import { getGameDetail, likeGame, unlikeGame } from '../../games/gameApi';
import {
  gamesKeys,
  syncGameLikeStateInQueryCache,
} from '../../games/queryCache';
import type { RecommendationDisplayItem } from '../types';

const LIKE_ERROR_MESSAGE =
  '좋아요 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const LIKE_LOGIN_REQUIRED_MESSAGE = '로그인 후 좋아요를 사용할 수 있어요.';
const FEEDBACK_MESSAGE_DURATION_MS = 3000;

type RecommendationLikeMutationVariables = {
  gameId: number;
  nextIsLiked: boolean;
  item: RecommendationDisplayItem;
};

type UseRecommendationLikeParams = {
  onSelectedGameLikeChange?: (gameId: number, isLiked: boolean) => void;
};

const isLikedGamesResponse = (value: unknown): value is LikedGamesResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Array.isArray((value as Partial<LikedGamesResponse>).results);
};

export const useRecommendationLike = ({
  onSelectedGameLikeChange,
}: UseRecommendationLikeParams = {}) => {
  const queryClient = useQueryClient();
  const [pendingLikeGameId, setPendingLikeGameId] = useState<number | null>(
    null,
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, FEEDBACK_MESSAGE_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [feedbackMessage]);

  const updateLikedGamesCache = (
    item: RecommendationDisplayItem,
    nextIsLiked: boolean,
  ) => {
    queryClient.setQueriesData<LikedGamesResponse>(
      { queryKey: authKeys.likedGames() },
      (current) => {
        if (!isLikedGamesResponse(current)) {
          return current;
        }

        const currentLikedGames = current as LikedGamesResponse;

        if (nextIsLiked) {
          const alreadyExists = currentLikedGames.results.some(
            (likedGame) => likedGame.game_id === item.game_id,
          );

          if (alreadyExists) {
            return current;
          }

          return {
            ...currentLikedGames,
            count: currentLikedGames.count + 1,
            results: [
              {
                game_id: item.game_id,
                game_title: item.title,
                thumbnail_url: item.thumbnail_url,
                genres: item.genres,
                liked_at: new Date().toISOString(),
              },
              ...currentLikedGames.results,
            ],
          };
        }

        const nextResults = currentLikedGames.results.filter(
          (likedGame) => likedGame.game_id !== item.game_id,
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

  const likeMutation = useMutation({
    mutationFn: ({
      gameId,
      nextIsLiked,
    }: RecommendationLikeMutationVariables) =>
      nextIsLiked ? likeGame(gameId) : unlikeGame(gameId),
    onMutate: ({ gameId }) => {
      setPendingLikeGameId(gameId);
      setFeedbackMessage(null);
    },
    onSuccess: async (response, variables) => {
      updateLikedGamesCache(variables.item, response.isLiked);
      onSelectedGameLikeChange?.(response.gameId, response.isLiked);
      syncGameLikeStateInQueryCache(queryClient, {
        gameId: response.gameId,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
      });

      try {
        const detail = await queryClient.fetchQuery({
          queryKey: gamesKeys.detail(response.gameId),
          queryFn: () => getGameDetail(response.gameId),
          staleTime: 60_000,
        });

        queryClient.setQueriesData<LikedGamesResponse>(
          { queryKey: authKeys.likedGames() },
          (current) => {
            if (!isLikedGamesResponse(current) || !response.isLiked) {
              return current;
            }

            const currentLikedGames = current as LikedGamesResponse;

            return {
              ...currentLikedGames,
              results: currentLikedGames.results.map((likedGame) =>
                likedGame.game_id === response.gameId
                  ? {
                      ...likedGame,
                      game_title: detail.title.trim() || likedGame.game_title,
                      thumbnail_url:
                        detail.coverImageUrl ?? likedGame.thumbnail_url,
                      genres: detail.genres.length
                        ? detail.genres
                        : likedGame.genres,
                    }
                  : likedGame,
              ),
            };
          },
        );
      } catch {
        // 상세 조회 실패는 좋아요 토글 결과를 되돌릴 이유가 아니므로 무시합니다.
      }

      void queryClient.invalidateQueries({
        queryKey: authKeys.likedGames(),
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        setFeedbackMessage(LIKE_LOGIN_REQUIRED_MESSAGE);
        return;
      }

      setFeedbackMessage(LIKE_ERROR_MESSAGE);
    },
    onSettled: () => {
      setPendingLikeGameId(null);
    },
  });

  const handleToggleLike = (item: RecommendationDisplayItem) => {
    likeMutation.mutate({
      gameId: item.game_id,
      nextIsLiked: !item.is_liked,
      item,
    });
  };

  return {
    pendingLikeGameId,
    feedbackMessage,
    setFeedbackMessage,
    handleToggleLike,
  };
};
