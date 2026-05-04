import { create } from 'zustand';
import type {
  CurrentUserProfileResponse,
  CurrentUserSocialResponse,
} from '../features/auth/types/auth';

/**
 * [Auth] 쿠키 기반 세션 복구 업데이트
 * - Access Token: sessionStorage 및 클라이언트 메모리(Zustand State)에서 유지합니다.
 * - Refresh Token: 브라우저 HttpOnly Cookie 기반 관리 (백엔드 주도)
 * - 레거시 localStorage 인증 키는 앱 시작 시 1회 정리합니다.
 */

export type AuthBootstrapStatus = 'idle' | 'loading' | 'ready';
export type AuthAccessStatus = 'loading' | 'authenticated' | 'unauthenticated';

export const AUTH_ACCESS_TOKEN_STORAGE_KEY = 'access_token';
const LEGACY_AUTH_ACCESS_TOKEN_STORAGE_KEY = 'auth-access-token';
const AUTH_PROFILE_PREVIEW_STORAGE_KEY = 'auth-profile-preview-image-url';

export const readStoredAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const persistedAccessToken =
    window.sessionStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY)?.trim() ?? '';

  if (persistedAccessToken) {
    return persistedAccessToken;
  }

  const legacyAccessToken =
    window.sessionStorage
      .getItem(LEGACY_AUTH_ACCESS_TOKEN_STORAGE_KEY)
      ?.trim() ?? '';

  if (!legacyAccessToken) {
    return null;
  }

  window.sessionStorage.setItem(
    AUTH_ACCESS_TOKEN_STORAGE_KEY,
    legacyAccessToken,
  );
  window.sessionStorage.removeItem(LEGACY_AUTH_ACCESS_TOKEN_STORAGE_KEY);

  return legacyAccessToken;
};

const persistAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedToken = token?.trim() ?? '';

  if (!normalizedToken) {
    window.sessionStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_AUTH_ACCESS_TOKEN_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, normalizedToken);
  window.sessionStorage.removeItem(LEGACY_AUTH_ACCESS_TOKEN_STORAGE_KEY);
};

const readPersistedProfilePreviewImageUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(AUTH_PROFILE_PREVIEW_STORAGE_KEY);
};

const persistProfilePreviewImageUrl = (profileImageUrl?: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedProfileImageUrl = profileImageUrl?.trim() ?? '';

  if (!normalizedProfileImageUrl) {
    window.sessionStorage.removeItem(AUTH_PROFILE_PREVIEW_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    AUTH_PROFILE_PREVIEW_STORAGE_KEY,
    normalizedProfileImageUrl,
  );
};

interface AuthState {
  accessToken: string | null;
  account: CurrentUserProfileResponse | null;
  socialAccount: CurrentUserSocialResponse | null;
  profilePreviewImageUrl: string | null;
  isAuthenticated: boolean;
  authBootstrapStatus: AuthBootstrapStatus;
  setAccessToken: (token: string) => void;
  setAccount: (account: CurrentUserProfileResponse | null) => void;
  setSocialAccount: (socialAccount: CurrentUserSocialResponse | null) => void;
  setAuth: (
    token: string,
    account: CurrentUserProfileResponse,
    socialAccount: CurrentUserSocialResponse,
  ) => void;
  clearAuth: () => void;
  setAuthBootstrapStatus: (status: AuthBootstrapStatus) => void;
}

export type AuthSessionStateSnapshot = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isAuthReady: boolean;
  authBootstrapStatus: AuthBootstrapStatus;
  accessStatus: AuthAccessStatus;
};

export const useAuthStore = create<AuthState>((set) => {
  const persistedAccessToken = readStoredAccessToken();

  return {
    accessToken: persistedAccessToken,
    account: null,
    socialAccount: null,
    profilePreviewImageUrl: readPersistedProfilePreviewImageUrl(),
    isAuthenticated: Boolean(persistedAccessToken),
    authBootstrapStatus: 'idle',

    setAccessToken: (token) => {
      const normalizedToken = token.trim();
      persistAccessToken(normalizedToken);
      set({
        accessToken: normalizedToken,
        isAuthenticated: Boolean(normalizedToken),
      });
    },

    setAccount: (account) => {
      persistProfilePreviewImageUrl(account?.profile_img_url);
      set({
        account,
        profilePreviewImageUrl: account?.profile_img_url?.trim() ?? null,
      });
    },

    setSocialAccount: (socialAccount) => {
      set({
        socialAccount,
      });
    },

    setAuth: (token, account, socialAccount) => {
      const normalizedToken = token.trim();
      persistAccessToken(normalizedToken);
      persistProfilePreviewImageUrl(account?.profile_img_url);
      set({
        accessToken: normalizedToken,
        account,
        socialAccount,
        profilePreviewImageUrl: account?.profile_img_url?.trim() ?? null,
        isAuthenticated: true,
      });
    },

    clearAuth: () => {
      persistAccessToken(null);
      persistProfilePreviewImageUrl(null);
      set({
        accessToken: null,
        account: null,
        socialAccount: null,
        profilePreviewImageUrl: null,
        isAuthenticated: false,
      });
    },

    setAuthBootstrapStatus: (status) => {
      set({
        authBootstrapStatus: status,
      });
    },
  };
});

export const syncAccessTokenFromStorage = () => {
  const storedAccessToken = readStoredAccessToken();
  const currentState = useAuthStore.getState();
  const normalizedStoredAccessToken = storedAccessToken?.trim() ?? null;
  const normalizedStateAccessToken = currentState.accessToken?.trim() ?? null;

  if (normalizedStoredAccessToken === normalizedStateAccessToken) {
    return normalizedStoredAccessToken;
  }

  if (normalizedStoredAccessToken) {
    currentState.setAccessToken(normalizedStoredAccessToken);
    return normalizedStoredAccessToken;
  }

  currentState.clearAuth();
  return null;
};

/**
 * 기존 localStorage에 저장되던 모든 인증 관련 레거시 키를 삭제합니다.
 */
export const clearLegacyAuthStorage = () => {
  if (typeof window === 'undefined') return;

  const LEGACY_KEYS = [
    'auth-storage', // Zustand persist key
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'tokenStorage',
    'infoStorage',
  ];

  LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
};
