import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { likeGame, unlikeGame } from '../../games/gameApi';
import { syncLikeMutationStateInQueryCache } from '../../games/queryCache';
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
    onSuccess: (response, variables) => {
      syncLikeMutationStateInQueryCache(queryClient, {
        gameId: response.gameId,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
        likedGame: {
          gameId: variables.item.game_id,
          title: variables.item.title,
          thumbnailUrl: variables.item.thumbnail_url,
          genres: variables.item.genres,
        },
      });
      onSelectedGameLikeChange?.(response.gameId, response.isLiked);
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
