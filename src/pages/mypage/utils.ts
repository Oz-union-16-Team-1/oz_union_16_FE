import type {
  AuthGender,
  LikedGameItemResponse,
} from '../../features/auth/types/auth';
import type { GameListItem } from '../../features/games/types';
import type { FavoriteGamePreview } from '../../features/mypage/types';

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
  game: LikedGameItemResponse,
): FavoriteGamePreview => {
  const normalizedGenres = game.genres.filter((genre) => genre.trim());

  return {
    gameId: game.game_id,
    title: game.game_title.trim() || 'N/A',
    summary: normalizedGenres.length > 0 ? normalizedGenres.join(', ') : 'N/A',
    thumbnailUrl: game.thumbnail_url,
    genres: normalizedGenres,
  };
};

export const toFavoriteGameListItem = (
  game: FavoriteGamePreview,
): GameListItem => ({
  gameId: game.gameId,
  name: game.title,
  genres: game.genres.length > 0 ? game.genres : ['N/A'],
  thumbnailUrl: game.thumbnailUrl,
  rating: null,
  isLiked: true,
});
