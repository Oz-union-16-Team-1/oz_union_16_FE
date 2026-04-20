export interface ErrorResponseBody {
  detail?: string | Record<string, string[]>;
  error_detail?: string | Record<string, string[]>;
  suspended_at?: string | null;
}
