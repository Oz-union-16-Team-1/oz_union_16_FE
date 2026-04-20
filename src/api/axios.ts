import axios from 'axios';

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
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 적이 없으며, 인증 제외 경로가 아닐 때
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      shouldResetAuthSession(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        // Refresh Token은 쿠키에 담겨 자동으로 전송됨
        const response = await axios.post(
          `${apiBaseUrl}/api/v1/accounts/token/refresh`,
          {},
          {
            withCredentials: true,
          },
        );

        const { access_token } = response.data;

        // 새 토큰 저장
        useAuthStore.getState().setAccessToken(access_token);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 리프레시 실패 시 (세션 만료) 로그아웃 처리
        useAuthStore.getState().clearAuth();

        // 브라우저 환경에서만 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }

        return Promise.reject(refreshError);
      }
    }

    console.error('API 에러 발생:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);
