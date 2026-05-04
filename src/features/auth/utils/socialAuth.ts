import { configuredApiBaseUrl } from '../../../lib/env';
import { AUTH_BASE_PATH } from '../constants/auth';
import type { SocialAuthProvider } from '../types/auth';

export type { SocialAuthProvider } from '../types/auth';

const PENDING_SOCIAL_PROVIDER_STORAGE_KEY = 'pending-social-auth-provider';
const FALLBACK_BACKEND_ORIGIN = 'https://oz-pgti.duckdns.org';

const SOCIAL_AUTH_START_PATHS: Record<SocialAuthProvider, string> = {
  google: `${AUTH_BASE_PATH}/social-login/google`,
  kakao: `${AUTH_BASE_PATH}/social-login/kakao`,
  naver: `${AUTH_BASE_PATH}/social-login/naver`,
};

const SOCIAL_AUTH_LOCAL_START_PATHS: Record<SocialAuthProvider, string> = {
  google: `${AUTH_BASE_PATH}/social-login/google/local`,
  kakao: `${AUTH_BASE_PATH}/social-login/kakao/local`,
  naver: `${AUTH_BASE_PATH}/social-login/naver/local`,
};

const resolveConfiguredSocialLoginUrl = (provider: SocialAuthProvider) => {
  const env = import.meta.env as Record<string, string | undefined>;

  const directUrlKeyByProvider: Record<SocialAuthProvider, string[]> = {
    google: ['VITE_GOOGLE_LOGIN_URL', 'VITE_SOCIAL_LOGIN_GOOGLE_URL'],
    kakao: ['VITE_KAKAO_LOGIN_URL', 'VITE_SOCIAL_LOGIN_KAKAO_URL'],
    naver: ['VITE_NAVER_LOGIN_URL', 'VITE_SOCIAL_LOGIN_NAVER_URL'],
  };

  const directUrl = directUrlKeyByProvider[provider]
    .map((key) => env[key]?.trim() ?? '')
    .find((value) => value.length > 0);

  if (directUrl) {
    return directUrl.replace(/\/$/, '');
  }

  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  return FALLBACK_BACKEND_ORIGIN;
};

export const getSocialLoginStartUrl = (provider: SocialAuthProvider) => {
  if (import.meta.env.DEV) {
    return SOCIAL_AUTH_LOCAL_START_PATHS[provider];
  }

  const socialLoginStartPath = SOCIAL_AUTH_START_PATHS[provider];
  const configuredSocialLoginUrl = resolveConfiguredSocialLoginUrl(provider);

  if (configuredSocialLoginUrl.includes('/api/')) {
    return configuredSocialLoginUrl;
  }

  return `${configuredSocialLoginUrl}${socialLoginStartPath}`;
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

export const getPendingSocialAuthProvider = (): SocialAuthProvider | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const provider = window.sessionStorage
    .getItem(PENDING_SOCIAL_PROVIDER_STORAGE_KEY)
    ?.trim();

  if (provider === 'google' || provider === 'kakao' || provider === 'naver') {
    return provider;
  }

  return null;
};

export const hasPendingSocialAuthProvider = () =>
  Boolean(getPendingSocialAuthProvider());

const getNormalizedSocialCallbackParam = (
  searchParams: URLSearchParams,
  key: string,
) => {
  const value = searchParams.get(key)?.trim();

  return value ? value : null;
};

export const getSocialCallbackAuthorizationCode = (
  searchParams: URLSearchParams,
) => getNormalizedSocialCallbackParam(searchParams, 'code');

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
  getNormalizedSocialCallbackParam(searchParams, 'error_description') ||
  getNormalizedSocialCallbackParam(searchParams, 'error_detail') ||
  getNormalizedSocialCallbackParam(searchParams, 'detail') ||
  getSocialCallbackErrorMessageFromCode(
    getNormalizedSocialCallbackParam(searchParams, 'error'),
  );
