import { create } from 'zustand';
import type {
  CurrentUserProfileResponse,
  CurrentUserSocialResponse,
} from '../features/auth/types/auth';

/**
 * [Auth] 쿠키 기반 세션 복구
 * - Access Token: 클라이언트 메모리(Zustand State)에서만 유지합니다.
 * - Refresh Token: 브라우저 HttpOnly Cookie 기반 관리 (백엔드 주도)
 * - 레거시 localStorage 인증 키는 앱 시작 시 1회 정리합니다.
 */

export type AuthBootstrapStatus = 'idle' | 'loading' | 'ready';
export type AuthAccessStatus = 'loading' | 'authenticated' | 'unauthenticated';

const AUTH_PROFILE_PREVIEW_STORAGE_KEY = 'auth-profile-preview-image-url';
const AUTH_SOCIAL_ACCOUNT_STORAGE_KEY = 'auth-social-account';

const readPersistedProfilePreviewImageUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(AUTH_PROFILE_PREVIEW_STORAGE_KEY);
};

const readPersistedSocialAccount = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const serializedSocialAccount = window.sessionStorage.getItem(
    AUTH_SOCIAL_ACCOUNT_STORAGE_KEY,
  );

  if (!serializedSocialAccount) {
    return null;
  }

  try {
    const parsedSocialAccount = JSON.parse(
      serializedSocialAccount,
    ) as CurrentUserSocialResponse;

    if (
      typeof parsedSocialAccount?.is_social === 'boolean' &&
      typeof parsedSocialAccount?.social_type === 'string'
    ) {
      return parsedSocialAccount;
    }
  } catch {
    window.sessionStorage.removeItem(AUTH_SOCIAL_ACCOUNT_STORAGE_KEY);
  }

  return null;
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

const persistSocialAccount = (
  socialAccount?: CurrentUserSocialResponse | null,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!socialAccount) {
    window.sessionStorage.removeItem(AUTH_SOCIAL_ACCOUNT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    AUTH_SOCIAL_ACCOUNT_STORAGE_KEY,
    JSON.stringify(socialAccount),
  );
};

interface AuthState {
  accessToken: string | null;
  account: CurrentUserProfileResponse | null;
  socialAccount: CurrentUserSocialResponse | null;
  profilePreviewImageUrl: string | null;
  isAuthenticated: boolean;
  authBootstrapStatus: AuthBootstrapStatus;
  setAccessToken: (token: string) => void;
  setAccount: (account: CurrentUserProfileResponse | null) => void;
  setSocialAccount: (socialAccount: CurrentUserSocialResponse | null) => void;
  setAuth: (
    token: string,
    account: CurrentUserProfileResponse,
    socialAccount: CurrentUserSocialResponse,
  ) => void;
  clearAuth: () => void;
  setAuthBootstrapStatus: (status: AuthBootstrapStatus) => void;
}

export type AuthSessionStateSnapshot = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isAuthReady: boolean;
  authBootstrapStatus: AuthBootstrapStatus;
  accessStatus: AuthAccessStatus;
};

export const useAuthStore = create<AuthState>((set) => {
  return {
    accessToken: null,
    account: null,
    socialAccount: readPersistedSocialAccount(),
    profilePreviewImageUrl: readPersistedProfilePreviewImageUrl(),
    isAuthenticated: false,
    authBootstrapStatus: 'idle',

    setAccessToken: (token) => {
      const normalizedToken = token.trim();
      set({
        accessToken: normalizedToken,
        isAuthenticated: Boolean(normalizedToken),
      });
    },

    setAccount: (account) => {
      persistProfilePreviewImageUrl(account?.profile_img_url);
      set({
        account,
        profilePreviewImageUrl: account?.profile_img_url?.trim() ?? null,
      });
    },

    setSocialAccount: (socialAccount) => {
      persistSocialAccount(socialAccount);
      set({
        socialAccount,
      });
    },

    setAuth: (token, account, socialAccount) => {
      const normalizedToken = token.trim();
      persistProfilePreviewImageUrl(account?.profile_img_url);
      persistSocialAccount(socialAccount);
      set({
        accessToken: normalizedToken,
        account,
        socialAccount,
        profilePreviewImageUrl: account?.profile_img_url?.trim() ?? null,
        isAuthenticated: true,
      });
    },

    clearAuth: () => {
      persistProfilePreviewImageUrl(null);
      persistSocialAccount(null);
      set({
        accessToken: null,
        account: null,
        socialAccount: null,
        profilePreviewImageUrl: null,
        isAuthenticated: false,
      });
    },

    setAuthBootstrapStatus: (status) => {
      set({
        authBootstrapStatus: status,
      });
    },
  };
});

export const readMemoryAccessToken = () =>
  useAuthStore.getState().accessToken?.trim() || null;

/**
 * 기존 브라우저 저장소에 남아 있던 인증 관련 레거시 키를 삭제합니다.
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
  LEGACY_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
  window.sessionStorage.removeItem('auth-access-token');
};
