import type { QueryClient } from '@tanstack/react-query';

import { isMockServiceWorkerEnabled } from '../../lib/env';
import { gamesKeys } from './queryCache';
import type { GameDetail, GameListItem } from './types';

let mockStateModulePromise: Promise<typeof import('./mocks/state')> | null =
  null;

const loadMockStateModule = () => {
  if (!mockStateModulePromise) {
    mockStateModulePromise = import('./mocks/state');
  }

  return mockStateModulePromise;
};

const createPrimedDetailSnapshot = (
  detail: GameDetail,
  game: GameListItem,
): GameDetail => ({
  ...detail,
  title: detail.title?.trim() ? detail.title : game.name.trim() || 'N/A',
  genres: detail.genres.length ? detail.genres : game.genres,
  coverImageUrl: detail.coverImageUrl ?? game.thumbnailUrl,
  isLiked: typeof game.isLiked === 'boolean' ? game.isLiked : detail.isLiked,
});

export const primeGameDetailCacheFromList = async (
  queryClient: QueryClient,
  games: GameListItem[],
) => {
  if (!isMockServiceWorkerEnabled() || games.length === 0) {
    return;
  }

  const { getStoredGameDetailSnapshot } = await loadMockStateModule();

  games.forEach((game) => {
    const currentDetail = queryClient.getQueryData<GameDetail>(
      gamesKeys.detail(game.gameId),
    );

    if (currentDetail) {
      return;
    }

    const snapshot = getStoredGameDetailSnapshot(game.gameId);

    if (!snapshot) {
      return;
    }

    queryClient.setQueryData<GameDetail>(
      gamesKeys.detail(game.gameId),
      createPrimedDetailSnapshot(snapshot, game),
    );
  });
};
