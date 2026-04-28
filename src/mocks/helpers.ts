import { HttpResponse } from 'msw';

export const mockErrorResponse = (status: number, message: string) =>
  HttpResponse.json({ error_detail: message }, { status });

export const parsePositiveInteger = (
  value: string | null,
  fallback: number,
) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
