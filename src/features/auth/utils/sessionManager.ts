import { AxiosError } from 'axios';

import { useAuthStore } from '../../../store/useAuthStore';
import {
  AUTH_SESSION_EXPIRED_NOTICE_MESSAGE,
  AUTH_SESSION_RESTORE_FAILED_NOTICE_MESSAGE,
  createAuthSessionExpiredEvent,
  type AuthSessionExpiredDetail,
} from '../constants/session';
import {
  getCurrentUserProfile,
  getCurrentUserSocialProfile,
  refreshAccessToken,
} from '../api/auth';
import { logRefreshStoreSync } from '../api/auth.diagnostics';
import type {
  CurrentUserProfileResponse,
  CurrentUserSocialResponse,
} from '../types/auth';

type RestoredAuthSession = {
  accessToken: string;
  profile: CurrentUserProfileResponse | null;
  socialAccount: CurrentUserSocialResponse | null;
};

type ClearAuthSessionOptions = {
  setReady?: boolean;
};

type RestoreAuthSessionOptions = {
  preferDirectBackendOriginInDev?: boolean;
};

let restoreAuthSessionPromise: Promise<RestoredAuthSession> | null = null;

export const setAuthBootstrapLoading = () => {
  useAuthStore.getState().setAuthBootstrapStatus('loading');
};

export const setAuthBootstrapReady = () => {
  useAuthStore.getState().setAuthBootstrapStatus('ready');
};

export const syncAuthAccount = (account: CurrentUserProfileResponse | null) => {
  useAuthStore.getState().setAccount(account);
};

export const syncAuthSocialAccount = (
  socialAccount: CurrentUserSocialResponse | null,
) => {
  useAuthStore.getState().setSocialAccount(socialAccount);
};

export const applyAccessToken = (accessToken: string) => {
  useAuthStore.getState().setAccessToken(accessToken);
};

export const applyAuthenticatedSession = (
  accessToken: string,
  account: CurrentUserProfileResponse,
  socialAccount: CurrentUserSocialResponse,
) => {
  useAuthStore.getState().setAuth(accessToken, account, socialAccount);
  setAuthBootstrapReady();
};

export const clearAuthSession = ({
  setReady = true,
}: ClearAuthSessionOptions = {}) => {
  useAuthStore.getState().clearAuth();

  if (setReady) {
    setAuthBootstrapReady();
  }
};

const hasSessionRestoreHint = () => {
  const store = useAuthStore.getState();

  return Boolean(
    store.isAuthenticated ||
    store.account ||
    store.profilePreviewImageUrl?.trim().length,
  );
};

const isAuthBootstrapPending = () =>
  useAuthStore.getState().authBootstrapStatus !== 'ready';

const isAuthSessionInvalidationError = (error: unknown) =>
  error instanceof AxiosError &&
  (error.response?.status === 401 || error.response?.status === 403);

export const hydrateAuthSessionFromAccessToken = async (
  accessToken: string,
) => {
  applyAccessToken(accessToken);

  const [profileResult, socialAccountResult] = await Promise.allSettled([
    getCurrentUserProfile(),
    getCurrentUserSocialProfile(),
  ]);
  const failedResults = [profileResult, socialAccountResult].filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  const invalidationError = failedResults.find((result) =>
    isAuthSessionInvalidationError(result.reason),
  );

  if (invalidationError) {
    clearAuthSession({
      setReady: !isAuthBootstrapPending(),
    });
    throw invalidationError.reason;
  }

  const currentStore = useAuthStore.getState();
  const profile =
    profileResult.status === 'fulfilled'
      ? profileResult.value
      : currentStore.account;
  const socialAccount =
    socialAccountResult.status === 'fulfilled'
      ? socialAccountResult.value
      : currentStore.socialAccount;

  if (profile && socialAccount) {
    applyAuthenticatedSession(accessToken, profile, socialAccount);

    return {
      accessToken,
      profile,
      socialAccount,
    };
  }

  syncAuthAccount(profile ?? null);
  syncAuthSocialAccount(socialAccount ?? null);
  setAuthBootstrapReady();

  return {
    accessToken,
    profile: profile ?? null,
    socialAccount: socialAccount ?? null,
  };
};

export const refreshStoredAccessToken = async (
  options: RestoreAuthSessionOptions = {},
) => {
  const { access_token: accessToken } = await refreshAccessToken(options);
  applyAccessToken(accessToken);
  logRefreshStoreSync(accessToken);
  return accessToken;
};

export const restoreAuthSession = async (
  options: RestoreAuthSessionOptions = {},
) => {
  try {
    const accessToken = await refreshStoredAccessToken(options);
    return await hydrateAuthSessionFromAccessToken(accessToken);
  } catch (error) {
    const shouldNotifySessionRestoreFailure = hasSessionRestoreHint();
    const shouldDeferSessionReset = isAuthBootstrapPending();

    clearAuthSession({
      setReady: !shouldDeferSessionReset,
    });

    if (shouldNotifySessionRestoreFailure && !shouldDeferSessionReset) {
      notifyAuthSessionExpired({
        noticeMessage: AUTH_SESSION_RESTORE_FAILED_NOTICE_MESSAGE,
        source: 'refresh',
      });
    }

    throw error;
  }
};

export const ensureAuthSessionRestored = (
  options: RestoreAuthSessionOptions = {},
) => {
  if (!restoreAuthSessionPromise) {
    restoreAuthSessionPromise = restoreAuthSession(options).finally(() => {
      restoreAuthSessionPromise = null;
    });
  }

  return restoreAuthSessionPromise;
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
  const shouldDeferSessionExpiration = isAuthBootstrapPending();

  clearAuthSession({
    setReady: !shouldDeferSessionExpiration,
  });

  if (shouldDeferSessionExpiration) {
    return;
  }

  notifyAuthSessionExpired(detail);
};
