export type RecommendationResultItemShape = {
  game_id: number;
  title: string;
  genres: string[];
  thumbnail_url: string | null;
  rating: number | null;
  is_liked: boolean;
};

export type RecommendationDisplayItem = RecommendationResultItemShape;
