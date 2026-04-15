import { AxiosError } from 'axios';

import { api } from '../../../api/axios';
import type {
  SurveyChatRequest,
  SurveyChatResponse,
  SurveyResetRequest,
  SurveyResetResponse,
  SurveyResultQuery,
  SurveyResultResponse,
  SurveySessionStartRequest,
  SurveySessionStartResponse,
} from '../types/survey';

interface ErrorResponseBody {
  detail?: string;
  error_detail?: string | Record<string, string[]>;
}

const SURVEY_BASE_PATH = '/api/v1/survey';

export const startSurveySession = async (
  payload: SurveySessionStartRequest,
) => {
  const response = await api.post<SurveySessionStartResponse>(
    `${SURVEY_BASE_PATH}/chat/sessions`,
    payload,
  );

  return response.data;
};

export const continueSurveyChat = async (payload: SurveyChatRequest) => {
  const response = await api.post<SurveyChatResponse>(
    `${SURVEY_BASE_PATH}/chat`,
    payload,
  );

  return response.data;
};

export const resetSurveySession = async (payload: SurveyResetRequest) => {
  const response = await api.post<SurveyResetResponse>(
    `${SURVEY_BASE_PATH}/sessions/reset`,
    payload,
  );

  return response.data;
};

export const getSurveyResults = async (query: SurveyResultQuery) => {
  const response = await api.get<SurveyResultResponse>(
    `${SURVEY_BASE_PATH}/result`,
    {
      params: query,
    },
  );

  return response.data;
};

export const extractApiErrorMessage = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return '요청을 처리하는 중 알 수 없는 오류가 발생했습니다.';
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
