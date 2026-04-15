import { AxiosError } from 'axios';

import { api } from '@/api/axios';
import { AUTH_BASE_PATH } from '../constants/auth';
import type {
  CheckIdDuplicateRequest,
  CheckNicknameDuplicateRequest,
  DuplicateCheckResponse,
  ErrorResponseBody,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  SignupRequest,
  SignupResponse,
} from '../types/auth';

export const login = async (payload: LoginRequest) => {
  const response = await api.post<LoginResponse>(
    `${AUTH_BASE_PATH}/login`,
    payload,
  );

  return response.data;
};

export const logout = async () => {
  const response = await api.post<LogoutResponse>(`${AUTH_BASE_PATH}/logout`);

  return response.data;
};

export const signup = async (payload: SignupRequest) => {
  const response = await api.post<SignupResponse>(
    `${AUTH_BASE_PATH}/signup`,
    payload,
  );

  return response.data;
};

export const checkIdDuplicate = async (payload: CheckIdDuplicateRequest) => {
  const response = await api.post<DuplicateCheckResponse>(
    `${AUTH_BASE_PATH}/check-id`,
    payload,
  );

  return response.data;
};

export const checkNicknameDuplicate = async (
  payload: CheckNicknameDuplicateRequest,
) => {
  const response = await api.post<DuplicateCheckResponse>(
    `${AUTH_BASE_PATH}/check-nickname`,
    payload,
  );

  return response.data;
};

const extractFieldErrorMessage = (
  value?: string | Record<string, string[]>,
) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const [firstMessageGroup] = Object.values(value);

    if (typeof firstMessageGroup === 'string') {
      return firstMessageGroup;
    }

    if (Array.isArray(firstMessageGroup) && firstMessageGroup[0]) {
      return firstMessageGroup[0];
    }
  }

  return null;
};

export const extractAuthApiErrorMessage = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return '요청을 처리하는 중 알 수 없는 오류가 발생했습니다.';
  }

  const data = error.response?.data as ErrorResponseBody | undefined;

  const detailMessage = extractFieldErrorMessage(data?.detail);

  if (detailMessage) {
    return detailMessage;
  }

  const errorDetailMessage = extractFieldErrorMessage(data?.error_detail);

  if (errorDetailMessage) {
    return errorDetailMessage;
  }

  return '요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
};
