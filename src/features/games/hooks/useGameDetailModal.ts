import type { GameListItem } from '../types';
import { useGameDetailData } from './useGameDetailData';
import { useGameDetailLikeAction } from './useGameDetailLikeAction';

export const useGameDetailModal = (game: GameListItem) => {
  const {
    detailQuery,
    detail,
    detailErrorKind,
    hasFallbackSummary,
    hasResolvedDetail,
  } = useGameDetailData(game);
  const {
    clearToast,
    handleToggleLike,
    isLikeInteractionDisabled,
    isLiked,
    likeCount,
    likeLabel,
    toast,
  } = useGameDetailLikeAction({
    game,
    detail,
  });

  return {
    canRenderFallbackSummary: hasFallbackSummary,
    clearToast,
    detail,
    detailErrorKind,
    detailQuery,
    handleToggleLike,
    hasResolvedDetail,
    isLikeInteractionDisabled,
    isLiked,
    likeCount,
    likeLabel,
    toast,
  };
};
