import { AxiosError } from 'axios';

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_RESULT_PAGE_SIZE = 20;

export const getMainGamesErrorMessage = (
  error: unknown,
  isSearchMode: boolean,
) => {
  const subject = isSearchMode ? '검색 결과' : '인기 게임 목록';

  if (error instanceof AxiosError) {
    if (!error.response) {
      return `${subject} 서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.`;
    }

    const data = error.response.data as
      | { detail?: string; error_detail?: string }
      | undefined;

    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (typeof data?.error_detail === 'string') {
      return data.error_detail;
    }
  }

  return `${subject}을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`;
};
