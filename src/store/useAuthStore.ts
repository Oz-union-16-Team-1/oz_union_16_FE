import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

const AUTH_STORAGE_KEY = 'auth-storage';
const LEGACY_ACCESS_TOKEN_KEYS = ['accessToken', 'access_token'] as const;
const LEGACY_REFRESH_TOKEN_KEYS = ['refreshToken', 'refresh_token'] as const;
const LEGACY_PERSIST_KEYS = ['tokenStorage', 'infoStorage'] as const;

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

interface AuthState {
  accessToken: string | null;
  account: CurrentUserProfileResponse | null;
  setAccessToken: (token: string) => void;
  setAccount: (account: CurrentUserProfileResponse | null) => void;
  clearAuthTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: getLegacyAccessToken(),
      account: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setAccount: (account) => set({ account }),
      clearAuthTokens: () => set({ accessToken: null, account: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
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

  for (const key of LEGACY_PERSIST_KEYS) {
    window.localStorage.removeItem(key);
  }
};

export const getLegacyAccessTokenFromStorage = getLegacyAccessToken;
export const clearAuthPersistedStorage = () => {
  useAuthStore.persist.clearStorage();
  clearLegacyAuthStorage();
};
