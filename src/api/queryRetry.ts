import { AxiosError } from 'axios';

const MAX_RETRY_COUNT = 1;

export const shouldRetryApiQuery = (failureCount: number, error: unknown) => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    if (typeof status === 'number' && status >= 400 && status < 500) {
      return false;
    }
  }

  return failureCount < MAX_RETRY_COUNT;
};
