import { apiBaseUrl } from '@/lib/env';
import { AUTH_BASE_PATH } from '../constants/auth';
import type { SocialAuthProvider } from '../types/auth';

export type { SocialAuthProvider } from '../types/auth';

const PENDING_SOCIAL_PROVIDER_STORAGE_KEY = 'pending-social-auth-provider';

const SOCIAL_AUTH_START_URL_ENV_KEYS: Record<SocialAuthProvider, string[]> = {
  google: ['VITE_GOOGLE_LOGIN_URL', 'VITE_SOCIAL_LOGIN_GOOGLE_URL'],
  kakao: ['VITE_KAKAO_LOGIN_URL', 'VITE_SOCIAL_LOGIN_KAKAO_URL'],
  naver: ['VITE_NAVER_LOGIN_URL', 'VITE_SOCIAL_LOGIN_NAVER_URL'],
};

const SOCIAL_AUTH_LOGIN_PATHS: Record<SocialAuthProvider, string> = {
  google: `${AUTH_BASE_PATH}/login/google`,
  kakao: `${AUTH_BASE_PATH}/login/kakao`,
  naver: `${AUTH_BASE_PATH}/login/naver`,
};

const isSocialAuthProvider = (
  value: string | null | undefined,
): value is SocialAuthProvider =>
  value === 'google' || value === 'kakao' || value === 'naver';

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

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
  const configuredUrl = getSocialLoginStartUrlFromEnv(provider);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (apiBaseUrl) {
    if (isAbsoluteUrl(apiBaseUrl)) {
      return new URL(SOCIAL_AUTH_LOGIN_PATHS[provider], apiBaseUrl).toString();
    }

    if (typeof window !== 'undefined') {
      return new URL(
        SOCIAL_AUTH_LOGIN_PATHS[provider],
        window.location.origin,
      ).toString();
    }
  }

  return SOCIAL_AUTH_LOGIN_PATHS[provider];
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

export const getSocialCallbackProvider = (searchParams: URLSearchParams) => {
  const providerFromQuery = searchParams.get('provider');

  if (isSocialAuthProvider(providerFromQuery)) {
    clearPendingSocialAuthProvider();
    return providerFromQuery;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const providerFromStorage = window.sessionStorage.getItem(
    PENDING_SOCIAL_PROVIDER_STORAGE_KEY,
  );
  clearPendingSocialAuthProvider();

  return isSocialAuthProvider(providerFromStorage) ? providerFromStorage : null;
};

export const getSocialCallbackErrorMessage = (searchParams: URLSearchParams) =>
  searchParams.get('error_description') ||
  searchParams.get('error_detail') ||
  searchParams.get('detail') ||
  searchParams.get('error');

export const getSocialCallbackCode = (searchParams: URLSearchParams) =>
  searchParams.get('code')?.trim() || null;

export const getSocialCallbackState = (searchParams: URLSearchParams) =>
  searchParams.get('state')?.trim() || null;
