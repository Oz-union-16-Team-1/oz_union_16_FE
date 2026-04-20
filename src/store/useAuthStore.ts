import { create } from 'zustand';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

/**
 * [Refactor] 인증 아키텍처 업데이트 (#94)
 * - Access Token: 보안 강화를 위해 클라이언트 메모리(State)에서만 관리 (XSS 방어)
 * - Refresh Token: 브라우저 HttpOnly Cookie 기반 관리 (백엔드 주도)
 * - persist 미들웨어를 제거하여 새로고침 시 세션 만료를 의도하거나,
 *   Axios Interceptor를 통한 Silent Refresh로 세션을 유지합니다.
 */

interface AuthState {
  accessToken: string | null;
  account: CurrentUserProfileResponse | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setAccount: (account: CurrentUserProfileResponse | null) => void;
  setAuth: (token: string, account: CurrentUserProfileResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  account: null,
  isAuthenticated: false,

  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: !!token,
    }),

  setAccount: (account) => set({ account }),

  setAuth: (token, account) =>
    set({
      accessToken: token,
      account: account,
      isAuthenticated: true,
    }),

  clearAuth: () => {
    set({
      accessToken: null,
      account: null,
      isAuthenticated: false,
    });

    // 기존 localStorage 기반 레거시 데이터 완전 삭제
    clearLegacyAuthStorage();
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
