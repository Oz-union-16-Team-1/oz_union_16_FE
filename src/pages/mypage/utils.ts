import type {
  AuthGender,
  LikedGameItemResponse,
} from '../../features/auth/types/auth';
import type { GameListItem } from '../../features/games/types';
import type { FavoriteGamePreview } from './types';

const DEFAULT_DISPLAY_TEXT = 'N/A';

export const toDisplayText = (
  value: string | null | undefined,
  fallback = DEFAULT_DISPLAY_TEXT,
) => {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  return trimmedValue || fallback;
};

export const toOptionalDisplayText = (value: string | null | undefined) => {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  return trimmedValue || null;
};

export const toStringList = (value: string[] | null | undefined) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    : [];

export const toGenderLabel = (gender?: AuthGender) => {
  if (gender === 'M') {
    return '남성';
  }

  if (gender === 'W') {
    return '여성';
  }

  return 'N/A';
};

export const toFavoriteGamePreview = (
  game: Partial<LikedGameItemResponse> | null | undefined,
): FavoriteGamePreview => {
  const normalizedGenres = toStringList(game?.genres);

  return {
    gameId:
      typeof game?.game_id === 'number' && Number.isInteger(game.game_id)
        ? game.game_id
        : 0,
    title: toDisplayText(game?.game_title),
    summary: normalizedGenres.length > 0 ? normalizedGenres.join(', ') : 'N/A',
    thumbnailUrl: toOptionalDisplayText(game?.thumbnail_url),
    genres: normalizedGenres,
  };
};

export const toFavoriteGameListItem = (
  game: Partial<FavoriteGamePreview> | null | undefined,
): GameListItem => {
  const normalizedGenres = toStringList(game?.genres);

  return {
    gameId:
      typeof game?.gameId === 'number' && Number.isInteger(game.gameId)
        ? game.gameId
        : 0,
    name: toDisplayText(game?.title),
    genres: normalizedGenres.length > 0 ? normalizedGenres : ['N/A'],
    thumbnailUrl: toOptionalDisplayText(game?.thumbnailUrl),
    rating: null,
    isLiked: true,
  };
};
