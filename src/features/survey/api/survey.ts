import { AxiosError } from 'axios';

import { api } from '../../../api/axios';
import { isMockServiceWorkerEnabled } from '../../../lib/env';
import {
  continueMockSurveyChat,
  getMockSurveyResults,
  resetMockSurveySession,
  startMockSurveySession,
} from '../mocks/runtime';
import type {
  SurveyApiChatRequest,
  SurveyApiResetResponse,
  SurveyApiResultItem,
  SurveyApiResultResponse,
  SurveyApiSessionResponse,
  SurveyChatRequest,
  SurveyChatResponse,
  SurveyResetResponse,
  SurveyResultQuery,
  SurveyResultResponse,
  SurveyApiSessionStartRequest,
  SurveySessionStartRequest,
  SurveySessionStartResponse,
  SurveyProgress,
  SurveyResultItem,
  SurveySessionStatus,
  SurveyApiProgress,
} from '../types/survey';

interface ErrorResponseBody {
  detail?: string;
  error_detail?: string | Record<string, string[]>;
  retry_after_seconds?: number;
}

const SURVEY_BASE_PATH = '/api/v1/survey';
const SURVEY_CHATBOT_BASE_PATH = `${SURVEY_BASE_PATH}/chatbot`;

const clampProgressRate = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  if (value > 1) {
    return Math.max(0, Math.min(value / 100, 1));
  }

  return Math.max(0, Math.min(value, 1));
};

const normalizeSurveyProgress = (
  progress: SurveyApiProgress | null | undefined,
  progressRate: number | null | undefined,
): SurveyProgress => {
  if (progress) {
    return {
      current_step:
        typeof progress.current_step === 'number' ? progress.current_step : 0,
      total_steps:
        typeof progress.total_steps === 'number' ? progress.total_steps : 0,
      completion_rate:
        typeof progress.completion_rate === 'number'
          ? clampProgressRate(progress.completion_rate)
          : clampProgressRate(progressRate),
    };
  }

  const completionRate = clampProgressRate(progressRate);

  return {
    current_step: Math.round(completionRate * 100),
    total_steps: 100,
    completion_rate: completionRate,
  };
};

const normalizeSurveyStatus = (
  status: SurveySessionStatus | null | undefined,
  isCompleted: boolean,
) => {
  if (status) {
    return status;
  }

  return isCompleted ? 'COMPLETED' : 'IN_PROGRESS';
};

export const normalizeSurveySessionResponse = (
  payload: SurveyApiSessionResponse,
): SurveySessionStartResponse => {
  const isCompleted = Boolean(payload.is_completed);
  const recommendationReady =
    typeof payload.recommendation_ready === 'boolean'
      ? payload.recommendation_ready
      : isCompleted;

  return {
    session_id: payload.session_id,
    assistant_message:
      payload.ai_question ??
      payload.ai_message ??
      payload.chatbot_reply ??
      null,
    progress: normalizeSurveyProgress(payload.progress, payload.progress_rate),
    status: normalizeSurveyStatus(payload.status, isCompleted),
    recommendation_ready: recommendationReady,
  };
};

export const normalizeSurveyResetResponse = (
  payload: SurveyApiResetResponse,
): SurveyResetResponse => normalizeSurveySessionResponse(payload);

const normalizeSurveyResultItem = (
  item: SurveyApiResultItem,
): SurveyResultItem => ({
  game_id: item.game_id,
  title:
    (typeof item.title === 'string' && item.title.trim()) ||
    (typeof item.name === 'string' && item.name.trim()) ||
    '제목 정보 준비 중',
  genres: Array.isArray(item.genres) ? item.genres : [],
  thumbnail_url: item.thumbnail_url ?? null,
  rating: typeof item.rating === 'number' ? item.rating : null,
  is_liked: Boolean(item.is_liked),
});

export const normalizeSurveyResultResponse = (
  payload: SurveyApiResultResponse,
): SurveyResultResponse => ({
  user_id: typeof payload.user_id === 'number' ? payload.user_id : undefined,
  count:
    typeof payload.count === 'number'
      ? payload.count
      : (payload.results?.length ?? 0),
  next: typeof payload.next === 'string' ? payload.next : null,
  results: Array.isArray(payload.results)
    ? payload.results.map(normalizeSurveyResultItem)
    : [],
});

export const startSurveySession = async (
  payload: SurveySessionStartRequest,
): Promise<SurveySessionStartResponse> => {
  try {
    const response = await api.post<SurveyApiSessionResponse>(
      `${SURVEY_CHATBOT_BASE_PATH}/sessions/`,
      payload satisfies SurveyApiSessionStartRequest,
    );

    return normalizeSurveySessionResponse(response.data);
  } catch (error) {
    if (!isMockServiceWorkerEnabled()) {
      throw error;
    }

    return normalizeSurveySessionResponse(startMockSurveySession());
  }
};

export const continueSurveyChat = async (
  payload: SurveyChatRequest,
): Promise<SurveyChatResponse> => {
  try {
    const response = await api.post<SurveyApiSessionResponse>(
      `${SURVEY_CHATBOT_BASE_PATH}/sessions/${payload.session_id}/messages/`,
      {
        message: payload.user_answer,
      } satisfies SurveyApiChatRequest,
    );

    return normalizeSurveySessionResponse(response.data);
  } catch (error) {
    if (!isMockServiceWorkerEnabled()) {
      throw error;
    }

    return normalizeSurveySessionResponse(
      continueMockSurveyChat({
        session_id: payload.session_id,
        message: payload.user_answer,
      }),
    );
  }
};

export const resetSurveySession = async () => {
  try {
    const response = await api.post<SurveyApiResetResponse>(
      `${SURVEY_CHATBOT_BASE_PATH}/sessions/reset/`,
    );

    return normalizeSurveyResetResponse(response.data);
  } catch (error) {
    if (!isMockServiceWorkerEnabled()) {
      throw error;
    }

    return normalizeSurveyResetResponse(resetMockSurveySession());
  }
};

export const getSurveyResults = async (query: SurveyResultQuery) => {
  try {
    const response = await api.get<SurveyApiResultResponse>(
      `${SURVEY_CHATBOT_BASE_PATH}/sessions/${query.session_id}/recommendations/`,
      {
        params: {
          cursor: query.cursor,
          page_size: query.page_size,
          sort: query.sort,
        },
      },
    );

    return normalizeSurveyResultResponse(response.data);
  } catch (error) {
    if (!isMockServiceWorkerEnabled()) {
      throw error;
    }

    return normalizeSurveyResultResponse(
      getMockSurveyResults({
        cursor: query.cursor ?? null,
        pageSize: query.page_size,
        sessionId: query.session_id,
      }),
    );
  }
};

export const extractApiErrorMessage = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return '요청을 처리하는 중 알 수 없는 오류가 발생했습니다.';
  }

  if (!error.response) {
    return '서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const data = error.response?.data as ErrorResponseBody | undefined;

  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (typeof data?.error_detail === 'string') {
    return data.error_detail;
  }

  if (data?.error_detail && typeof data.error_detail === 'object') {
    const [firstMessageGroup] = Object.values(data.error_detail);

    if (typeof firstMessageGroup === 'string') {
      return firstMessageGroup;
    }

    if (Array.isArray(firstMessageGroup) && firstMessageGroup[0]) {
      return firstMessageGroup[0];
    }
  }

  return '요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
};

export const extractApiRetryAfterSeconds = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return null;
  }

  const data = error.response?.data as ErrorResponseBody | undefined;

  return typeof data?.retry_after_seconds === 'number' &&
    Number.isFinite(data.retry_after_seconds)
    ? data.retry_after_seconds
    : null;
};
