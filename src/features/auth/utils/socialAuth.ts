import { mockServiceWorkerEnabled } from '@/lib/env';
import { AUTH_BASE_PATH } from '../constants/auth';
import type { SocialAuthProvider } from '../types/auth';

export type { SocialAuthProvider } from '../types/auth';

const PENDING_SOCIAL_PROVIDER_STORAGE_KEY = 'pending-social-auth-provider';

const SOCIAL_AUTH_START_PATHS: Record<SocialAuthProvider, string> = {
  google: `${AUTH_BASE_PATH}/social-login/google`,
  kakao: `${AUTH_BASE_PATH}/social-login/kakao`,
  naver: `${AUTH_BASE_PATH}/social-login/naver`,
};

export const getSocialLoginStartUrl = (provider: SocialAuthProvider) => {
  const socialLoginStartPath = SOCIAL_AUTH_START_PATHS[provider];

  if (mockServiceWorkerEnabled) {
    return socialLoginStartPath;
  }

  // Always use relative path to go through Vite Proxy in development
  return socialLoginStartPath;
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
