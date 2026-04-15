import {
  clearLegacyAuthStorage,
  getLegacyAccessTokenFromStorage,
  getLegacyRefreshTokenFromStorage,
  useAuthStore,
} from '../store/useAuthStore';

export const getAccessToken = () => {
  return (
    useAuthStore.getState().accessToken ?? getLegacyAccessTokenFromStorage()
  );
};

export const getRefreshToken = () => {
  return (
    useAuthStore.getState().refreshToken ?? getLegacyRefreshTokenFromStorage()
  );
};

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  useAuthStore.getState().setAuthTokens(accessToken, refreshToken);
  clearLegacyAuthStorage();
};

export const setAccessToken = (token: string) => {
  useAuthStore.getState().setAccessToken(token);
  clearLegacyAuthStorage();
};

export const clearAccessToken = () => {
  useAuthStore.getState().clearAuthTokens();
  clearLegacyAuthStorage();
};

export const clearAuthTokens = clearAccessToken;
