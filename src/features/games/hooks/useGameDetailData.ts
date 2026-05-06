import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { shouldRetryApiQuery } from '../../../api/queryRetry';
import {
  GAME_DETAIL_GC_TIME,
  GAME_DETAIL_STALE_TIME,
  mergeGameDetail,
} from '../detailUtils';
import { getGameDetail } from '../gameApi';
import { gamesKeys } from '../queryCache';
import type { GameDetail, GameListItem } from '../types';

export type DetailErrorKind = 'not-found' | 'error' | null;

const getDetailErrorKind = (error: unknown): DetailErrorKind => {
  if (!(error instanceof AxiosError)) {
    return error ? 'error' : null;
  }

  if (error.response?.status === 404) {
    return 'not-found';
  }

  return 'error';
};

export const useGameDetailData = (game: GameListItem) => {
  const queryClient = useQueryClient();

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

  return {
    detailQuery,
    detail,
    detailErrorKind,
    hasFallbackSummary,
    hasResolvedDetail: Boolean(detail),
  };
};
