import { mockServiceWorkerEnabled } from '@/lib/env';
import type { LoginResponse, RefreshAccessTokenResponse } from '../types/auth';

const MOCK_REFRESH_TOKEN_STORAGE_KEY = 'mock-refresh-token';

type AuthTokenResponse = Pick<LoginResponse, 'access_token' | 'refresh_token'> &
  Partial<Pick<RefreshAccessTokenResponse, 'refresh_token'>>;

const readMockRefreshToken = () => {
  if (!mockServiceWorkerEnabled || typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(MOCK_REFRESH_TOKEN_STORAGE_KEY) ?? '';
};

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

export const hasMockRefreshToken = () => Boolean(readMockRefreshToken().trim());

export const clearMockRefreshToken = () => {
  persistMockRefreshToken(null);
};

export const createRefreshTokenFallbackRequestBody = () => {
  if (!mockServiceWorkerEnabled) {
    return {};
  }

  const refreshToken = readMockRefreshToken().trim();

  return refreshToken ? { refresh_token: refreshToken } : {};
};

export const normalizeAuthTokenResponse = <T extends AuthTokenResponse>(
  response: T,
  sourceLabel: '로그인' | '토큰 갱신',
) => {
  const normalizedAccessToken = response.access_token?.trim() ?? '';

  if (!normalizedAccessToken) {
    throw new Error(`${sourceLabel} 응답에 access_token이 없습니다.`);
  }

  return {
    ...response,
    access_token: normalizedAccessToken,
  };
};

export const syncMockRefreshTokenFromResponse = (
  response: AuthTokenResponse,
) => {
  if (!mockServiceWorkerEnabled) {
    return;
  }

  persistMockRefreshToken(
    response.refresh_token ??
      deriveMockRefreshTokenFromAccessToken(response.access_token),
  );
};
