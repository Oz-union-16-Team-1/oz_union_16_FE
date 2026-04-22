import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

import { logAxiosError } from './logApiError';
import { refreshAccessToken } from '../features/auth/api/auth';
import {
  AUTH_SESSION_EXPIRED_NOTICE_MESSAGE,
  createAuthSessionExpiredEvent,
} from '../features/auth/constants/session';
import { apiBaseUrl } from '../lib/env';
import { useAuthStore } from '../store/useAuthStore';

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

const shouldResetAuthSession = (requestUrl?: string) => {
  if (!requestUrl) return true;
  return !AUTH_EXCLUDED_PATHS.some((path) => requestUrl.includes(path));
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshAccessTokenPromise: Promise<string> | null = null;

const clearAuthAndNotifySessionExpired = () => {
  useAuthStore.getState().clearAuth();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      createAuthSessionExpiredEvent({
        noticeMessage: AUTH_SESSION_EXPIRED_NOTICE_MESSAGE,
        source: 'refresh',
      }),
    );
  }
};

const getRefreshedAccessToken = async () => {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = refreshAccessToken()
      .then(({ access_token }) => {
        useAuthStore.getState().setAccessToken(access_token);
        return access_token;
      })
      .catch((refreshError) => {
        clearAuthAndNotifySessionExpired();

        if (refreshError instanceof AxiosError) {
          logAxiosError(refreshError, 'auth-refresh');
        } else {
          console.error('[auth-refresh] unexpected error');
        }

        throw refreshError;
      })
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
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

// 요청 인터셉터: 메모리에 있는 Access Token을 Authorization 헤더에 삽입
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // 401 에러이고, 재시도한 적이 없으며, 인증 제외 경로가 아닐 때
    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      shouldResetAuthSession(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await getRefreshedAccessToken();

        // 원래 요청 재시도
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
