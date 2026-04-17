import { apiBaseUrl } from '@/lib/env';
import { ROUTES } from '@/constants/routes';
import { AUTH_BASE_PATH } from '../constants/auth';

export type SocialAuthProvider = 'google' | 'kakao' | 'naver';

const SOCIAL_AUTH_START_URL_ENV_KEYS: Record<SocialAuthProvider, string> = {
  google: 'VITE_SOCIAL_LOGIN_GOOGLE_URL',
  kakao: 'VITE_SOCIAL_LOGIN_KAKAO_URL',
  naver: 'VITE_SOCIAL_LOGIN_NAVER_URL',
};

const SOCIAL_AUTH_DEFAULT_PATHS: Record<SocialAuthProvider, string> = {
  google: `${AUTH_BASE_PATH}/oauth/google/login`,
  kakao: `${AUTH_BASE_PATH}/oauth/kakao/login`,
  naver: `${AUTH_BASE_PATH}/oauth/naver/login`,
};

const getSocialLoginStartUrlFromEnv = (provider: SocialAuthProvider) => {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[SOCIAL_AUTH_START_URL_ENV_KEYS[provider]]?.trim();

  return value || null;
};

const getSocialCallbackUrl = () => {
  if (typeof window === 'undefined') {
    return `/${ROUTES.AUTH_CALLBACK}`;
  }

  return new URL(`/${ROUTES.AUTH_CALLBACK}`, window.location.origin).toString();
};

export const getSocialLoginStartUrl = (provider: SocialAuthProvider) => {
  const configuredUrl = getSocialLoginStartUrlFromEnv(provider);

  if (configuredUrl) {
    return configuredUrl;
  }

  const basePath = SOCIAL_AUTH_DEFAULT_PATHS[provider];
  const callbackUrl = getSocialCallbackUrl();

  if (apiBaseUrl) {
    const url = new URL(basePath, apiBaseUrl);
    url.searchParams.set('redirect_uri', callbackUrl);
    return url.toString();
  }

  const searchParams = new URLSearchParams({
    redirect_uri: callbackUrl,
  });

  return `${basePath}?${searchParams.toString()}`;
};

export const getSocialCallbackErrorMessage = (searchParams: URLSearchParams) =>
  searchParams.get('error_description') ||
  searchParams.get('error_detail') ||
  searchParams.get('detail') ||
  searchParams.get('error');

export const getSocialCallbackAccessToken = (searchParams: URLSearchParams) =>
  searchParams.get('access_token') || searchParams.get('token');
