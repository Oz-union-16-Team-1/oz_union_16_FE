import type { LikedGameItemResponse, LikedGamesResponse } from '../types/auth';

export type LikedGameCacheSeed = {
  gameId: number;
  title?: string | null;
  thumbnailUrl?: string | null;
  genres?: string[] | null;
  likedAt?: string;
};

const normalizeTitle = (value?: string | null) => value?.trim() ?? '';

const normalizeGenres = (genres?: string[] | null) =>
  Array.isArray(genres)
    ? genres.map((genre) => genre.trim()).filter((genre) => genre.length > 0)
    : [];

export const isLikedGamesResponse = (
  value: unknown,
): value is LikedGamesResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Array.isArray((value as Partial<LikedGamesResponse>).results);
};

const createNextLikedGameItem = ({
  existingItem,
  seed,
}: {
  existingItem?: LikedGameItemResponse;
  seed: LikedGameCacheSeed;
}): LikedGameItemResponse => {
  const nextTitle =
    normalizeTitle(seed.title) ||
    normalizeTitle(existingItem?.game_title) ||
    'N/A';
  const nextGenres = normalizeGenres(seed.genres);

  return {
    game_id: seed.gameId,
    game_title: nextTitle,
    thumbnail_url: seed.thumbnailUrl ?? existingItem?.thumbnail_url ?? null,
    genres: nextGenres.length ? nextGenres : (existingItem?.genres ?? []),
    liked_at:
      existingItem?.liked_at ?? seed.likedAt ?? new Date().toISOString(),
  };
};

export const applyLikeStateToLikedGamesResponse = (
  current: LikedGamesResponse,
  {
    isLiked,
    seed,
  }: {
    isLiked: boolean;
    seed: LikedGameCacheSeed;
  },
): LikedGamesResponse => {
  const existingIndex = current.results.findIndex(
    (likedGame) => likedGame.game_id === seed.gameId,
  );

  if (isLiked) {
    const existingItem =
      existingIndex >= 0 ? current.results[existingIndex] : undefined;
    const nextItem = createNextLikedGameItem({
      existingItem,
      seed,
    });

    if (existingItem) {
      return {
        ...current,
        results: current.results.map((likedGame, index) =>
          index === existingIndex ? nextItem : likedGame,
        ),
      };
    }

    return {
      ...current,
      count: current.count + 1,
      results: [nextItem, ...current.results],
    };
  }

  if (existingIndex < 0) {
    return current;
  }

  return {
    ...current,
    count: Math.max(0, current.count - 1),
    results: current.results.filter(
      (likedGame) => likedGame.game_id !== seed.gameId,
    ),
  };
};
