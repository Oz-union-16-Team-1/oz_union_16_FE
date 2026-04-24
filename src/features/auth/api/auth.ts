import axios, { AxiosError } from 'axios';

import { api } from '@/api/axios';
import { apiBaseUrl, mockServiceWorkerEnabled } from '@/lib/env';
import { AUTH_BASE_PATH } from '../constants/auth';
import type {
  CheckIdDuplicateRequest,
  CheckNicknameDuplicateRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ConfirmProfileImageRequest,
  ConfirmProfileImageResponse,
  CurrentUserProfileResponse,
  DeleteAccountRequest,
  DeleteLikedGameResponse,
  DuplicateCheckResponse,
  ErrorResponseBody,
  LikedGamesRequest,
  LikedGamesResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  ProfileImagePresignedUrlRequest,
  ProfileImagePresignedUrlResponse,
  RefreshAccessTokenResponse,
  SignupRequest,
  SignupResponse,
  UpdateUserInfoRequest,
  UploadFileToS3Request,
} from '../types/auth';

const normalizeApiBaseUrl = (value: string) => value.trim().replace(/\/$/, '');
const authApiUrl = `${normalizeApiBaseUrl(apiBaseUrl)}${AUTH_BASE_PATH}`;
const AUTH_REFRESH_TIMEOUT_MS = 7000;
const DEFAULT_API_ERROR_MESSAGE =
  '요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
const MOCK_REFRESH_TOKEN_STORAGE_KEY = 'mock-refresh-token';

type LoginFieldName = keyof LoginRequest;

const readMockRefreshToken = () => {
  if (!mockServiceWorkerEnabled || typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(MOCK_REFRESH_TOKEN_STORAGE_KEY) ?? '';
};

export const hasMockRefreshToken = () => Boolean(readMockRefreshToken().trim());

const persistMockRefreshToken = (refreshToken: string | null | undefined) => {
  if (!mockServiceWorkerEnabled || typeof window === 'undefined') {
    return;
  }

  const normalizedRefreshToken = refreshToken?.trim() ?? '';

  if (!normalizedRefreshToken) {
    window.sessionStorage.removeItem(MOCK_REFRESH_TOKEN_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    MOCK_REFRESH_TOKEN_STORAGE_KEY,
    normalizedRefreshToken,
  );
};

const deriveMockRefreshTokenFromAccessToken = (accessToken: string) => {
  const normalizedAccessToken = accessToken.trim();
  const mockAccessTokenPrefix = 'mock-access-token-';

  if (!normalizedAccessToken.startsWith(mockAccessTokenPrefix)) {
    return null;
  }

  const loginId = normalizedAccessToken.slice(mockAccessTokenPrefix.length);

  if (!loginId) {
    return null;
  }

  return `mock-refresh-token-${loginId}`;
};

export type LoginErrorStatusCode = 400 | 401 | 403;

export type LoginErrorPolicy = {
  fallbackMessage: string;
  defaultFocusField: LoginFieldName | null;
  hideFormMessageWhenFieldError: boolean;
  preferApiMessage: boolean;
};

export type ResolveLoginApiErrorResult = {
  statusCode: LoginErrorStatusCode | null;
  fieldErrors: Partial<Record<LoginFieldName, string>>;
  message: string;
  focusField: LoginFieldName | null;
};

export const LOGIN_ERROR_POLICIES: Record<
  LoginErrorStatusCode,
  LoginErrorPolicy
> = {
  400: {
    fallbackMessage: '아이디 또는 비밀번호를 입력해주세요.',
    defaultFocusField: null,
    hideFormMessageWhenFieldError: true,
    preferApiMessage: false,
  },
  401: {
    fallbackMessage: '아이디 또는 비밀번호가 올바르지 않습니다.',
    defaultFocusField: 'password',
    hideFormMessageWhenFieldError: false,
    preferApiMessage: true,
  },
  403: {
    fallbackMessage:
      '접근 권한이 없거나 이용이 제한된 계정입니다. 고객센터에 문의하세요.',
    defaultFocusField: null,
    hideFormMessageWhenFieldError: false,
    preferApiMessage: true,
  },
};

export const login = async (payload: LoginRequest) => {
  const response = await api.post<LoginResponse>(
    `${AUTH_BASE_PATH}/login`,
    payload,
  );
  const normalizedAccessToken = response.data.access_token?.trim() ?? '';

  if (!normalizedAccessToken) {
    throw new Error('로그인 응답에 access_token이 없습니다.');
  }

  if (mockServiceWorkerEnabled) {
    persistMockRefreshToken(
      response.data.refresh_token ??
        deriveMockRefreshTokenFromAccessToken(normalizedAccessToken),
    );
  }

  return {
    ...response.data,
    access_token: normalizedAccessToken,
  };
};

export const logout = async () => {
  try {
    const response = await api.post<LogoutResponse>(`${AUTH_BASE_PATH}/logout`);
    return response.data;
  } finally {
    if (mockServiceWorkerEnabled) {
      persistMockRefreshToken(null);
    }
  }
};

export const refreshAccessToken = async () => {
  const requestBody = (() => {
    if (!mockServiceWorkerEnabled) {
      return {};
    }

    const refreshToken = readMockRefreshToken().trim();

    return refreshToken ? { refresh_token: refreshToken } : {};
  })();

  // 실서버 기준으로 refresh token은 HttpOnly 쿠키 기반으로 관리합니다.
  // 단, DEV+MSW에서는 새로고침 복구 안정화를 위해 sessionStorage refresh_token을 body fallback으로 함께 전송합니다.
  try {
    const response = await axios.post<RefreshAccessTokenResponse>(
      `${authApiUrl}/token/refresh`,
      requestBody,
      {
        withCredentials: true,
        timeout: AUTH_REFRESH_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const normalizedAccessToken = response.data.access_token?.trim() ?? '';

    if (!normalizedAccessToken) {
      throw new Error('토큰 갱신 응답에 access_token이 없습니다.');
    }

    if (mockServiceWorkerEnabled) {
      persistMockRefreshToken(
        response.data.refresh_token ??
          deriveMockRefreshTokenFromAccessToken(normalizedAccessToken),
      );
    }

    return {
      ...response.data,
      access_token: normalizedAccessToken,
    };
  } catch (error) {
    if (mockServiceWorkerEnabled) {
      persistMockRefreshToken(null);
    }

    throw error;
  }
};

export const getCurrentUserProfile = async () => {
  const response = await api.get<CurrentUserProfileResponse>(
    `${AUTH_BASE_PATH}/me`,
  );

  return response.data;
};

export const updateUserInfo = async (payload: UpdateUserInfoRequest) => {
  const response = await api.patch<CurrentUserProfileResponse>(
    `${AUTH_BASE_PATH}/me`,
    payload,
  );

  return response.data;
};

export const getLikedGames = async (payload: LikedGamesRequest = {}) => {
  const response = await api.get<LikedGamesResponse>(
    `${AUTH_BASE_PATH}/me/game-like`,
    {
      params: payload,
    },
  );

  return response.data;
};

export const unlikeLikedGame = async (gameId: number) => {
  const response = await api.delete<DeleteLikedGameResponse>(
    `${AUTH_BASE_PATH}/me/game-like/${gameId}`,
  );

  return response.data;
};

export const getProfileImagePresignedUrl = async (
  payload: ProfileImagePresignedUrlRequest,
) => {
  // Presigned URL 발급 경로는 백엔드 정책 고정 시 해당 엔드포인트로 유지합니다.
  const response = await api.post<ProfileImagePresignedUrlResponse>(
    `${AUTH_BASE_PATH}/me/profile-image/presigned-url`,
    payload,
  );

  return response.data;
};

export const uploadFileToS3 = async ({
  presigned_url,
  file,
  content_type,
}: UploadFileToS3Request) => {
  const resolvedContentType =
    content_type || file.type || 'application/octet-stream';

  await axios.put(presigned_url, file, {
    headers: {
      'Content-Type': resolvedContentType,
    },
    withCredentials: false,
  });
};

export const confirmProfileImage = async (
  payload: ConfirmProfileImageRequest,
) => {
  const response = await api.patch<ConfirmProfileImageResponse>(
    `${AUTH_BASE_PATH}/me/profile-image`,
    payload,
  );

  return response.data;
};

export const changePassword = async (payload: ChangePasswordRequest) => {
  const response = await api.post<ChangePasswordResponse>(
    `${AUTH_BASE_PATH}/me/change-password`,
    payload,
  );

  return response.data;
};

export const deleteAccount = async (payload: DeleteAccountRequest) => {
  await api.delete(`${AUTH_BASE_PATH}/me`, {
    data: payload,
  });
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

const extractFieldErrors = (
  value?: string | Record<string, string[]>,
): Record<string, string> => {
  if (!value || typeof value === 'string') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([fieldName, messages]) => {
        if (typeof messages === 'string') {
          return [fieldName, messages];
        }

        if (Array.isArray(messages) && messages[0]) {
          return [fieldName, messages[0]];
        }

        return null;
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  );
};

export const extractAuthApiFieldErrors = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return {};
  }

  const data = error.response?.data as ErrorResponseBody | undefined;

  return {
    ...extractFieldErrors(data?.detail),
    ...extractFieldErrors(data?.error_detail),
  };
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

  return DEFAULT_API_ERROR_MESSAGE;
};

const getFirstLoginErrorField = (
  fieldErrors: Partial<Record<LoginFieldName, string>>,
  payload?: Partial<LoginRequest>,
) => {
  if (fieldErrors.login_id) {
    return 'login_id';
  }

  if (fieldErrors.password) {
    return 'password';
  }

  if (payload) {
    const loginId = payload.login_id?.trim() ?? '';
    const password = payload.password?.trim() ?? '';

    if (!loginId) {
      return 'login_id';
    }

    if (!password) {
      return 'password';
    }
  }

  return null;
};

const resolveLoginMessageByPolicy = ({
  policy,
  fieldErrors,
  apiMessage,
}: {
  policy: LoginErrorPolicy;
  fieldErrors: Partial<Record<LoginFieldName, string>>;
  apiMessage: string;
}) => {
  if (
    policy.hideFormMessageWhenFieldError &&
    getFirstLoginErrorField(fieldErrors)
  ) {
    return '';
  }

  if (policy.preferApiMessage && apiMessage !== DEFAULT_API_ERROR_MESSAGE) {
    return apiMessage;
  }

  return policy.fallbackMessage;
};

export const resolveLoginApiError = (
  error: unknown,
  payload?: Partial<LoginRequest>,
): ResolveLoginApiErrorResult => {
  const apiFieldErrors = extractAuthApiFieldErrors(error);
  const fieldErrors = {
    login_id: apiFieldErrors.login_id,
    password: apiFieldErrors.password,
  } satisfies Partial<Record<LoginFieldName, string>>;
  const focusField = getFirstLoginErrorField(fieldErrors, payload);

  if (!(error instanceof AxiosError)) {
    return {
      statusCode: null,
      fieldErrors,
      message: extractAuthApiErrorMessage(error),
      focusField,
    };
  }

  const statusCode = error.response?.status ?? null;
  const apiMessage = extractAuthApiErrorMessage(error);

  if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
    const policy = LOGIN_ERROR_POLICIES[statusCode];

    return {
      statusCode,
      fieldErrors,
      message: resolveLoginMessageByPolicy({
        policy,
        fieldErrors,
        apiMessage,
      }),
      focusField: focusField ?? policy.defaultFocusField,
    };
  }

  return {
    statusCode: null,
    fieldErrors,
    message: extractAuthApiErrorMessage(error),
    focusField,
  };
};

export const extractSuspendedAccountInfo = (error: unknown) => {
  if (!(error instanceof AxiosError) || error.response?.status !== 403) {
    return null;
  }

  const data = error.response.data as ErrorResponseBody | undefined;
  const errorMessage =
    extractFieldErrorMessage(data?.error_detail) ||
    extractFieldErrorMessage(data?.detail);

  if (errorMessage !== '정지된 계정입니다.') {
    return null;
  }

  return {
    message: errorMessage,
    suspendedAt:
      typeof data?.suspended_at === 'string' ? data.suspended_at : null,
  };
};
