import { useAuthStore } from '../store/useAuthStore';
import type { CurrentUserProfileResponse } from '../features/auth/types/auth';

/**
 * [Refactor] 인증 아키텍처 업데이트 (#94)
 * - 유틸리티 함수들을 새로운 Zustand 스토어 액션으로 연결합니다.
 */

export const getAccessToken = () => {
  return useAuthStore.getState().accessToken;
};

export const getAuthAccount = () => {
  return useAuthStore.getState().account;
};

export const setAccessToken = (token: string) => {
  useAuthStore.getState().setAccessToken(token);
};

export const setAuthAccount = (account: CurrentUserProfileResponse | null) => {
  useAuthStore.getState().setAccount(account);
};

export const clearAuthTokens = () => {
  useAuthStore.getState().clearAuth();
};

// 하위 호환성을 위한 별칭
export const clearAccessToken = clearAuthTokens;
