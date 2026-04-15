import { AxiosError } from 'axios';

import { api } from '../../../api/axios';
import type {
  DuplicateCheckResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from '../types/auth';

interface ErrorResponseBody {
  detail?: string;
  error_detail?: string | Record<string, string[]>;
}

const AUTH_BASE_PATH = '/api/v1/auth';

export const login = async (payload: LoginRequest) => {
  const response = await api.post<LoginResponse>(
    `${AUTH_BASE_PATH}/login`,
    payload,
  );

  return response.data;
};

export const signup = async (payload: SignupRequest) => {
  const response = await api.post<SignupResponse>(
    `${AUTH_BASE_PATH}/signup`,
    payload,
  );

  return response.data;
};

export const checkIdDuplicate = async (value: string) => {
  const response = await api.get<DuplicateCheckResponse>(
    `${AUTH_BASE_PATH}/check-id`,
    {
      params: { value },
    },
  );

  return response.data;
};

export const checkNicknameDuplicate = async (value: string) => {
  const response = await api.get<DuplicateCheckResponse>(
    `${AUTH_BASE_PATH}/check-nickname`,
    {
      params: { value },
    },
  );

  return response.data;
};

export const extractAuthApiErrorMessage = (error: unknown) => {
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
