export interface FavoriteGamePreview {
  gameId: number;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  genres: string[];
}
