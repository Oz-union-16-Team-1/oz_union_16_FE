import axios, { AxiosError } from 'axios';

import { getToggleLikeErrorMessage } from '../../games/likeError';
import { extractApiErrorMessage } from '../../survey/api/survey';

const MATCHING_LIKE_LOGIN_REQUIRED_MESSAGE =
  '로그인 후 좋아요를 사용할 수 있어요.';
const MATCHING_LIKE_ERROR_MESSAGE =
  '좋아요 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.';
const MATCHING_CANDIDATES_NETWORK_ERROR_MESSAGE =
  '매칭 후보 서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const MATCHING_CANDIDATES_TIMEOUT_ERROR_MESSAGE =
  '매칭 후보를 준비하는 데 평소보다 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.';

export const formatMatchingCandidateRating = (rating: number | null) => {
  if (typeof rating !== 'number') {
    return 'N/A';
  }

  const normalizedRating = rating <= 5 ? rating * 20 : rating;

  return `${normalizedRating.toFixed(1)}점`;
};

export const getMatchingLikeErrorMessage = (error: unknown) => {
  return getToggleLikeErrorMessage(error, {
    loginRequired: MATCHING_LIKE_LOGIN_REQUIRED_MESSAGE,
    defaultError: MATCHING_LIKE_ERROR_MESSAGE,
  });
};

export const isCanceledMatchCandidatesError = (error: unknown) => {
  if (axios.isCancel(error)) {
    return true;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof AxiosError) {
    return (
      error.code === AxiosError.ERR_CANCELED ||
      error.name === 'CanceledError' ||
      error.name === 'AbortError' ||
      error.message.toLowerCase().includes('canceled') ||
      error.message.toLowerCase().includes('aborted')
    );
  }

  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.toLowerCase().includes('canceled') ||
      error.message.toLowerCase().includes('aborted')
    );
  }

  return false;
};

export const getMatchCandidatesErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return MATCHING_CANDIDATES_TIMEOUT_ERROR_MESSAGE;
    }

    if (!error.response) {
      return MATCHING_CANDIDATES_NETWORK_ERROR_MESSAGE;
    }

    if (error.response.status === 400) {
      return '요청한 장르 정보가 올바르지 않습니다. 장르를 다시 선택해 주세요.';
    }

    if (error.response.status === 404) {
      return '해당 장르의 매칭 후보 게임이 아직 준비되지 않았습니다.';
    }
  }

  return extractApiErrorMessage(error);
};
