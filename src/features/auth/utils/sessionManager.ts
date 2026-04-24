import { useAuthStore } from '../../../store/useAuthStore';
import {
  AUTH_SESSION_EXPIRED_NOTICE_MESSAGE,
  AUTH_SESSION_RESTORE_FAILED_NOTICE_MESSAGE,
  createAuthSessionExpiredEvent,
  type AuthSessionExpiredDetail,
} from '../constants/session';
import { getCurrentUserProfile, refreshAccessToken } from '../api/auth';
import { logRefreshStoreSync } from '../api/auth.diagnostics';
import type { CurrentUserProfileResponse } from '../types/auth';

export const setAuthBootstrapLoading = () => {
  useAuthStore.getState().setAuthBootstrapStatus('loading');
};

export const setAuthBootstrapReady = () => {
  useAuthStore.getState().setAuthBootstrapStatus('ready');
};

export const syncAuthAccount = (account: CurrentUserProfileResponse | null) => {
  useAuthStore.getState().setAccount(account);
};

export const applyAccessToken = (accessToken: string) => {
  useAuthStore.getState().setAccessToken(accessToken);
};

export const applyAuthenticatedSession = (
  accessToken: string,
  account: CurrentUserProfileResponse,
) => {
  useAuthStore.getState().setAuth(accessToken, account);
  setAuthBootstrapReady();
};

export const clearAuthSession = () => {
  useAuthStore.getState().clearAuth();
  setAuthBootstrapReady();
};

const hasSessionRestoreHint = () => {
  const store = useAuthStore.getState();

  return Boolean(
    store.isAuthenticated ||
    store.account ||
    store.profilePreviewImageUrl?.trim().length,
  );
};

export const hydrateAuthSessionFromAccessToken = async (
  accessToken: string,
) => {
  applyAccessToken(accessToken);

  try {
    const profile = await getCurrentUserProfile();
    applyAuthenticatedSession(accessToken, profile);

    return {
      accessToken,
      profile,
    };
  } catch (error) {
    clearAuthSession();
    throw error;
  }
};

export const refreshStoredAccessToken = async () => {
  const { access_token: accessToken } = await refreshAccessToken();
  applyAccessToken(accessToken);
  logRefreshStoreSync(accessToken);
  return accessToken;
};

export const restoreAuthSession = async () => {
  try {
    const accessToken = await refreshStoredAccessToken();
    return await hydrateAuthSessionFromAccessToken(accessToken);
  } catch (error) {
    const shouldNotifySessionRestoreFailure = hasSessionRestoreHint();

    clearAuthSession();

    if (shouldNotifySessionRestoreFailure) {
      notifyAuthSessionExpired({
        noticeMessage: AUTH_SESSION_RESTORE_FAILED_NOTICE_MESSAGE,
        source: 'refresh',
      });
    }

    throw error;
  }
};

export const notifyAuthSessionExpired = (
  detail: AuthSessionExpiredDetail = {
    noticeMessage: AUTH_SESSION_EXPIRED_NOTICE_MESSAGE,
    source: 'refresh',
  },
) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(createAuthSessionExpiredEvent(detail));
};

export const expireAuthSession = (
  detail: AuthSessionExpiredDetail = {
    noticeMessage: AUTH_SESSION_EXPIRED_NOTICE_MESSAGE,
    source: 'refresh',
  },
) => {
  clearAuthSession();
  notifyAuthSessionExpired(detail);
};
