import { create } from 'zustand';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

/**
 * [Auth] 쿠키 기반 세션 복구 업데이트
 * - Access Token: 클라이언트 메모리(Zustand State)에서만 유지합니다.
 * - Refresh Token: 브라우저 HttpOnly Cookie 기반 관리 (백엔드 주도)
 * - 레거시 localStorage 인증 키는 앱 시작 시 1회 정리합니다.
 */

export type AuthBootstrapStatus = 'idle' | 'loading' | 'ready';

interface AuthState {
  accessToken: string | null;
  account: CurrentUserProfileResponse | null;
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
  isAuthenticated: false,
  authBootstrapStatus: 'idle',

  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: !!token,
      authBootstrapStatus: 'ready',
    }),

  setAccount: (account) => set({ account }),

  setAuth: (token, account) =>
    set({
      accessToken: token,
      account: account,
      isAuthenticated: true,
      authBootstrapStatus: 'ready',
    }),

  clearAuth: () => {
    set({
      accessToken: null,
      account: null,
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
