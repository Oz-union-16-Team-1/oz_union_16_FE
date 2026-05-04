import type { LoginRequest } from '../types/auth';
import {
  clearMockRefreshToken,
  createRefreshTokenFallbackRequestBody,
  normalizeAuthTokenResponse,
  syncMockRefreshTokenFromResponse,
} from './auth.session.helper';
import {
  logRefreshRequestFailed,
  logRefreshRequestStarted,
  logRefreshRequestSucceeded,
} from './auth.diagnostics';
import {
  requestLogin,
  requestLogout,
  requestRefreshAccessToken,
} from './auth.transport';

export {
  checkIdDuplicate,
  checkNicknameDuplicate,
  checkPassword,
  changePassword,
  confirmProfileImage,
  deleteAccount,
  getCurrentUserProfile,
  getCurrentUserSocialProfile,
  getLikedGames,
  getProfileImagePresignedUrl,
  signup,
  unlikeLikedGame,
  updateUserInfo,
  uploadFileToS3,
} from './auth.transport';
export {
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
  extractSuspendedAccountInfo,
  LOGIN_ERROR_POLICIES,
  resolveLoginApiError,
} from './auth.error.handler';
export type {
  LoginErrorPolicy,
  LoginErrorStatusCode,
  ResolveLoginApiErrorResult,
} from './auth.error.handler';
export { hasMockRefreshToken } from './auth.session.helper';

type RefreshAccessTokenOptions = {
  preferDirectBackendOriginInDev?: boolean;
};

export const login = async (payload: LoginRequest) => {
  const response = await requestLogin(payload);
  const normalizedResponse = normalizeAuthTokenResponse(response, '로그인');

  syncMockRefreshTokenFromResponse(normalizedResponse);

  return normalizedResponse;
};

export const logout = async () => {
  try {
    return await requestLogout();
  } finally {
    clearMockRefreshToken();
  }
};

export const refreshAccessToken = async (
  options: RefreshAccessTokenOptions = {},
) => {
  logRefreshRequestStarted();

  try {
    const response = await requestRefreshAccessToken(
      createRefreshTokenFallbackRequestBody(),
      options,
    );
    const normalizedResponse = normalizeAuthTokenResponse(
      response,
      '토큰 갱신',
    );

    syncMockRefreshTokenFromResponse(normalizedResponse);
    logRefreshRequestSucceeded(normalizedResponse.access_token);

    return normalizedResponse;
  } catch (error) {
    clearMockRefreshToken();
    logRefreshRequestFailed(error);
    throw error;
  }
};
