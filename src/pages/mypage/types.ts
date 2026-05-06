export interface FavoriteGamePreview {
  gameId: number;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  genres: string[];
}

export type MyPageToast = {
  tone: 'success' | 'error';
  message: string;
} | null;

export type MyPageToastPayload = Exclude<MyPageToast, null>;
