import { apiBaseUrl, mockServiceWorkerEnabled } from '@/lib/env';
import { AUTH_BASE_PATH } from '../constants/auth';
import type { SocialAuthProvider } from '../types/auth';

export type { SocialAuthProvider } from '../types/auth';

const PENDING_SOCIAL_PROVIDER_STORAGE_KEY = 'pending-social-auth-provider';

const SOCIAL_AUTH_START_URL_ENV_KEYS: Record<SocialAuthProvider, string[]> = {
  google: ['VITE_GOOGLE_LOGIN_URL', 'VITE_SOCIAL_LOGIN_GOOGLE_URL'],
  kakao: ['VITE_KAKAO_LOGIN_URL', 'VITE_SOCIAL_LOGIN_KAKAO_URL'],
  naver: ['VITE_NAVER_LOGIN_URL', 'VITE_SOCIAL_LOGIN_NAVER_URL'],
};

const SOCIAL_AUTH_START_PATHS: Record<SocialAuthProvider, string> = {
  google: `${AUTH_BASE_PATH}/social-login/google`,
  kakao: `${AUTH_BASE_PATH}/social-login/kakao`,
  naver: `${AUTH_BASE_PATH}/social-login/naver`,
};

const getSocialLoginStartUrlFromEnv = (provider: SocialAuthProvider) => {
  const env = import.meta.env as Record<string, string | undefined>;

  for (const envKey of SOCIAL_AUTH_START_URL_ENV_KEYS[provider]) {
    const value = env[envKey]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
};

export const getSocialLoginStartUrl = (provider: SocialAuthProvider) => {
  if (mockServiceWorkerEnabled) {
    return SOCIAL_AUTH_START_PATHS[provider];
  }

  const configuredUrl = getSocialLoginStartUrlFromEnv(provider);

  if (configuredUrl) {
    return configuredUrl;
  }

  const normalizedApiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');

  if (normalizedApiBaseUrl) {
    return `${normalizedApiBaseUrl}${SOCIAL_AUTH_START_PATHS[provider]}`;
  }

  return SOCIAL_AUTH_START_PATHS[provider];
};

export const setPendingSocialAuthProvider = (provider: SocialAuthProvider) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(PENDING_SOCIAL_PROVIDER_STORAGE_KEY, provider);
};

export const clearPendingSocialAuthProvider = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(PENDING_SOCIAL_PROVIDER_STORAGE_KEY);
};

const getSocialCallbackErrorMessageFromCode = (errorCode: string | null) => {
  if (!errorCode) {
    return null;
  }

  if (errorCode === 'social-login-failed') {
    return '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
  }

  return errorCode;
};

export const getSocialCallbackErrorMessage = (searchParams: URLSearchParams) =>
  searchParams.get('error_description') ||
  searchParams.get('error_detail') ||
  searchParams.get('detail') ||
  getSocialCallbackErrorMessageFromCode(searchParams.get('error'));
