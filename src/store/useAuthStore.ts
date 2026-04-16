import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

const AUTH_STORAGE_KEY = 'auth-storage';
const LEGACY_ACCESS_TOKEN_KEYS = ['accessToken', 'access_token'] as const;
const LEGACY_REFRESH_TOKEN_KEYS = ['refreshToken', 'refresh_token'] as const;

const getLegacyAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of LEGACY_ACCESS_TOKEN_KEYS) {
    const token = window.localStorage.getItem(key);

    if (token) {
      return token;
    }
  }

  return null;
};

const getLegacyRefreshToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of LEGACY_REFRESH_TOKEN_KEYS) {
    const token = window.localStorage.getItem(key);

    if (token) {
      return token;
    }
  }

  return null;
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  account: CurrentUserProfileResponse | null;
  setAuthTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setAccount: (account: CurrentUserProfileResponse | null) => void;
  clearAuthTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: getLegacyAccessToken(),
      refreshToken: getLegacyRefreshToken(),
      account: null,
      setAuthTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAccount: (account) => set({ account }),
      clearAuthTokens: () =>
        set({ accessToken: null, refreshToken: null, account: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        account: state.account,
      }),
    },
  ),
);

export const clearLegacyAuthStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of LEGACY_ACCESS_TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }

  for (const key of LEGACY_REFRESH_TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
};

export const getLegacyAccessTokenFromStorage = getLegacyAccessToken;
export const getLegacyRefreshTokenFromStorage = getLegacyRefreshToken;
