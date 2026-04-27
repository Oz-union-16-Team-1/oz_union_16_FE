import type { GameListItem } from '../../games/types';
import type { MatchResultItem } from '../../matching/types';
import type { SurveyResultItem } from '../../survey/types/survey';
import type { RecommendationDisplayItem } from '../types';

const FALLBACK_HIGHLIGHTS = ['몰입감', '스토리', '액션', '전략'];

export const normalizeRecommendationItem = (
  item: SurveyResultItem | MatchResultItem,
): RecommendationDisplayItem => ({
  game_id: item.game_id,
  title: item.title,
  genres: item.genres,
  thumbnail_url: item.thumbnail_url,
  rating: item.rating,
  is_liked: item.is_liked,
});

export const toGameListItem = (
  item: RecommendationDisplayItem,
): GameListItem => ({
  gameId: item.game_id,
  name: item.title,
  genres: item.genres,
  thumbnailUrl: item.thumbnail_url,
  rating: item.rating,
  isLiked: item.is_liked,
});

export const formatRecommendationRating = (rating: number | null) =>
  typeof rating === 'number' ? `${rating.toFixed(1)}점` : 'N/A';

export const getRecommendationHighlights = (
  items: RecommendationDisplayItem[],
) => {
  const genreCounts = new Map<string, number>();

  items.forEach((item) => {
    item.genres.forEach((genre) => {
      const trimmedGenre = genre.trim();

      if (!trimmedGenre) {
        return;
      }

      genreCounts.set(trimmedGenre, (genreCounts.get(trimmedGenre) ?? 0) + 1);
    });
  });

  const rankedGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre]) => genre);

  return rankedGenres.length > 0 ? rankedGenres : FALLBACK_HIGHLIGHTS;
};
