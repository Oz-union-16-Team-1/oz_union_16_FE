import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

/**
 * [Auth] 새로고침 로그인 유지 업데이트
 * - Access Token: 로컬 개발/테스트 흐름에 맞춰 localStorage 기반으로 유지합니다.
 * - Refresh Token: 브라우저 HttpOnly Cookie 기반 관리 (백엔드 주도)
 * - 로그아웃/세션 만료 시 localStorage 인증 데이터를 즉시 제거합니다.
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        account: state.account,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

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
