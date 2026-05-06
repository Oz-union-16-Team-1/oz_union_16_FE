import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

import { logAxiosError } from './logApiError';
import { apiBaseUrl } from '../lib/env';
import { readMemoryAccessToken } from '../store/useAuthStore';
import {
  expireAuthSession,
  refreshMemoryAccessToken,
} from '../features/auth/utils/sessionManager';

/**
 * [Refactor] 인증 아키텍처 업데이트 (#94)
 * - withCredentials: true 설정을 통해 쿠키(Refresh Token)를 자동으로 전송합니다.
 * - 401 에러 발생 시 /accounts/token/refresh를 통해 Access Token을 자동 갱신합니다.
 */

const AUTH_EXCLUDED_PATHS = [
  '/api/v1/accounts/login',
  '/api/v1/accounts/signup',
  '/api/v1/accounts/check-id',
  '/api/v1/accounts/check-nickname',
  '/api/v1/accounts/token/refresh', // 무한 루프 방지
];

const resolveRequestPath = (requestUrl?: string, baseURL?: string) => {
  if (!requestUrl) {
    return '';
  }

  try {
    if (requestUrl.startsWith('http://') || requestUrl.startsWith('https://')) {
      return new URL(requestUrl).pathname;
    }

    if (baseURL) {
      return new URL(requestUrl, baseURL).pathname;
    }
  } catch {
    return requestUrl;
  }

  return requestUrl;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

// 같은 런타임에서 동시에 터진 401 응답은 하나의 refresh 호출로 직렬화한다.
let isRefreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];

const shouldResetAuthSession = (requestUrl?: string, baseURL?: string) => {
  const requestPath = resolveRequestPath(requestUrl, baseURL);

  if (!requestPath) {
    return true;
  }

  return !AUTH_EXCLUDED_PATHS.some((path) => requestPath.includes(path));
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (subscriber: RefreshSubscriber) => {
  refreshSubscribers.push(subscriber);
};

const isRefreshSessionInvalidationError = (error: unknown) =>
  error instanceof AxiosError &&
  (error.response?.status === 401 || error.response?.status === 403);

const getRefreshedAccessToken = async () => {
  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const accessToken = await refreshMemoryAccessToken();
      onRefreshed(accessToken);
      return accessToken;
    } catch (refreshError) {
      onRefreshFailed(refreshError);

      if (isRefreshSessionInvalidationError(refreshError)) {
        expireAuthSession();
      }

      if (refreshError instanceof AxiosError) {
        logAxiosError(refreshError, 'auth-refresh');
      } else {
        console.error('[auth-refresh] unexpected error');
      }

      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  return new Promise<string>((resolve, reject) => {
    addRefreshSubscriber({
      resolve,
      reject,
    });
  });
};

const setAuthorizationHeader = (
  config: RetriableRequestConfig,
  accessToken: string,
) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  config.headers.Authorization = `Bearer ${accessToken}`;
};

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 7000,
  withCredentials: true, // 쿠키 기반 인증을 위해 필수
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 메모리 상태의 최신 Access Token을 Authorization 헤더에 싣는다.
api.interceptors.request.use(
  (config) => {
    const token = readMemoryAccessToken();

    if (token) {
      setAuthorizationHeader(config as RetriableRequestConfig, token);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터: 401 에러 시 Silent Refresh 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!(error instanceof AxiosError)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      shouldResetAuthSession(originalRequest.url, originalRequest.baseURL)
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await getRefreshedAccessToken();

        setAuthorizationHeader(originalRequest, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    logAxiosError(error, 'axios-response');
    return Promise.reject(error);
  },
);
