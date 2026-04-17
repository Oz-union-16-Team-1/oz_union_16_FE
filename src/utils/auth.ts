import {
  clearAuthPersistedStorage,
  clearLegacyAuthStorage,
  getLegacyAccessTokenFromStorage,
  useAuthStore,
} from '../store/useAuthStore';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

export const getAccessToken = () => {
  return (
    useAuthStore.getState().accessToken ?? getLegacyAccessTokenFromStorage()
  );
};

export const getAuthAccount = () => {
  return useAuthStore.getState().account;
};

export const setAccessToken = (token: string) => {
  useAuthStore.getState().setAccessToken(token);
  clearLegacyAuthStorage();
};

export const setAuthAccount = (account: CurrentUserProfileResponse | null) => {
  useAuthStore.getState().setAccount(account);
};

export const clearAccessToken = () => {
  useAuthStore.getState().clearAuthTokens();
  clearAuthPersistedStorage();
};

export const clearAuthTokens = clearAccessToken;
