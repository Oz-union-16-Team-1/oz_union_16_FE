import type { LikedGamesRequest } from '../types/auth';

const authRootKey = ['auth'] as const;
const authMeKey = [...authRootKey, 'me'] as const;
const authLikedGamesKey = [...authMeKey, 'game-like'] as const;

const resolveLikedGamesPage = (payload: LikedGamesRequest = {}) =>
  payload.page ?? 1;
const resolveLikedGamesPageSize = (payload: LikedGamesRequest = {}) =>
  payload.page_size;

export const authKeys = {
  all: authRootKey,
  login: () => [...authRootKey, 'login'] as const,
  signup: () => [...authRootKey, 'signup'] as const,
  logout: () => [...authRootKey, 'logout'] as const,
  me: () => authMeKey,
  likedGames: () => authLikedGamesKey,
  likedGamesList: (payload: LikedGamesRequest = {}) =>
    [
      ...authLikedGamesKey,
      resolveLikedGamesPage(payload),
      resolveLikedGamesPageSize(payload),
    ] as const,
  likedGamesInfinite: (payload: Pick<LikedGamesRequest, 'page_size'> = {}) =>
    [
      ...authLikedGamesKey,
      'infinite',
      resolveLikedGamesPageSize(payload),
    ] as const,
  unlikeLikedGame: () => [...authLikedGamesKey, 'unlike'] as const,
  profileImagePresignedUrl: () =>
    [...authMeKey, 'profile-image', 'presigned-url'] as const,
  profileImageUpload: () => [...authMeKey, 'profile-image', 'upload'] as const,
  profileImageConfirm: () =>
    [...authMeKey, 'profile-image', 'confirm'] as const,
  changePassword: () => [...authRootKey, 'change-password'] as const,
  deleteAccount: () => [...authRootKey, 'delete-account'] as const,
  checkIdDuplicate: () => [...authRootKey, 'check-id-duplicate'] as const,
  checkNicknameDuplicate: () =>
    [...authRootKey, 'check-nickname-duplicate'] as const,
};
