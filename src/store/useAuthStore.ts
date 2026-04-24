import { create } from 'zustand';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

/**
 * [Auth] 쿠키 기반 세션 복구 업데이트
 * - Access Token: 클라이언트 메모리(Zustand State)에서만 유지합니다.
 * - Refresh Token: 브라우저 HttpOnly Cookie 기반 관리 (백엔드 주도)
 * - 레거시 localStorage 인증 키는 앱 시작 시 1회 정리합니다.
 */

export type AuthBootstrapStatus = 'idle' | 'loading' | 'ready';

const AUTH_PROFILE_PREVIEW_STORAGE_KEY = 'auth-profile-preview-image-url';

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
  profilePreviewImageUrl: string | null;
  isAuthenticated: boolean;
  authBootstrapStatus: AuthBootstrapStatus;
  setAccessToken: (token: string) => void;
  setAccount: (account: CurrentUserProfileResponse | null) => void;
  setAuth: (token: string, account: CurrentUserProfileResponse) => void;
  clearAuth: () => void;
  setAuthBootstrapStatus: (status: AuthBootstrapStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  account: null,
  profilePreviewImageUrl: readPersistedProfilePreviewImageUrl(),
  isAuthenticated: false,
  authBootstrapStatus: 'idle',

  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: !!token,
      authBootstrapStatus: 'ready',
    }),

  setAccount: (account) => {
    persistProfilePreviewImageUrl(account?.profile_img_url);
    set({
      account,
      profilePreviewImageUrl: account?.profile_img_url?.trim() ?? null,
    });
  },

  setAuth: (token, account) => {
    persistProfilePreviewImageUrl(account?.profile_img_url);
    set({
      accessToken: token,
      account: account,
      profilePreviewImageUrl: account?.profile_img_url?.trim() ?? null,
      isAuthenticated: true,
      authBootstrapStatus: 'ready',
    });
  },

  clearAuth: () => {
    persistProfilePreviewImageUrl(null);
    set({
      accessToken: null,
      account: null,
      profilePreviewImageUrl: null,
      isAuthenticated: false,
    });
  },

  setAuthBootstrapStatus: (status) => {
    set({
      authBootstrapStatus: status,
    });
  },
}));

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

// 하위 호환성을 위한 export (점진적 교체용)
export const clearAuthTokens = () => useAuthStore.getState().clearAuth();
export const clearAuthPersistedStorage = clearLegacyAuthStorage;
export const getPersistedProfilePreviewImageUrl =
  readPersistedProfilePreviewImageUrl;
