import axios, { type AxiosRequestConfig } from 'axios';

import { api } from '@/api/axios';
import { apiBaseUrl } from '@/lib/env';
import { AUTH_BASE_PATH } from '../constants/auth';
import { logCredentialedAuthRequestDiagnostics } from './auth.diagnostics';
import type {
  CheckIdDuplicateRequest,
  CheckNicknameDuplicateRequest,
  CheckPasswordRequest,
  CheckPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ConfirmProfileImageRequest,
  ConfirmProfileImageResponse,
  CurrentUserProfileResponse,
  CurrentUserSocialResponse,
  DeleteLikedGameResponse,
  DuplicateCheckResponse,
  LikedGamesRequest,
  LikedGamesResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  ProfileImagePresignedUrlRequest,
  ProfileImagePresignedUrlResponse,
  RawLikedGameItemResponse,
  RawLikedGamesResponse,
  RefreshAccessTokenResponse,
  SignupRequest,
  SignupResponse,
  UpdateUserInfoRequest,
  UpdateUserInfoResponse,
  UploadFileToS3Request,
} from '../types/auth';

const AUTH_REFRESH_TIMEOUT_MS = 7000;

const normalizeApiBaseUrl = (value: string) => value.trim().replace(/\/$/, '');
const authApiUrl = `${normalizeApiBaseUrl(apiBaseUrl)}${AUTH_BASE_PATH}`;
const loginRequestUrl = `${authApiUrl}/login`;
const logoutRequestUrl = `${authApiUrl}/logout`;
const refreshRequestUrl = `${authApiUrl}/token/refresh`;

const createCredentialedAuthRequestConfig = <T = unknown>(
  config: AxiosRequestConfig<T> = {},
): AxiosRequestConfig<T> => {
  const { headers, ...restConfig } = config;

  return {
    ...restConfig,
    withCredentials: true,
    timeout: AUTH_REFRESH_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
  };
};

const normalizeLikedGameGenres = (
  genres: RawLikedGameItemResponse['genres'],
) =>
  Array.isArray(genres)
    ? genres.map((genre) => genre.trim()).filter((genre) => genre.length > 0)
    : genres
        .split(',')
        .map((genre) => genre.trim())
        .filter((genre) => genre.length > 0);

const normalizeLikedGamesResponse = (
  response: RawLikedGamesResponse,
): LikedGamesResponse => ({
  count: response.count,
  results: response.results.map((item) => ({
    ...item,
    genres: normalizeLikedGameGenres(item.genres),
  })),
});

export const requestLogin = async (payload: LoginRequest) => {
  const requestConfig = createCredentialedAuthRequestConfig();

  logCredentialedAuthRequestDiagnostics({
    label: 'login',
    requestUrl: loginRequestUrl,
    withCredentials: true,
  });

  const response = await api.post<LoginResponse>(
    `${AUTH_BASE_PATH}/login`,
    payload,
    requestConfig,
  );

  return response.data;
};

export const requestLogout = async () => {
  const requestConfig = createCredentialedAuthRequestConfig();

  logCredentialedAuthRequestDiagnostics({
    label: 'logout',
    requestUrl: logoutRequestUrl,
    withCredentials: true,
  });

  const response = await api.post<LogoutResponse>(
    `${AUTH_BASE_PATH}/logout`,
    undefined,
    requestConfig,
  );

  return response.data;
};

export const requestRefreshAccessToken = async (
  payload: { refresh_token?: string } = {},
) => {
  const requestConfig = createCredentialedAuthRequestConfig();
  const requestBody = payload.refresh_token?.trim() ? payload : undefined;

  logCredentialedAuthRequestDiagnostics({
    label: 'refresh',
    requestUrl: refreshRequestUrl,
    withCredentials: true,
  });

  const response = await axios.post<RefreshAccessTokenResponse>(
    refreshRequestUrl,
    requestBody,
    requestConfig,
  );

  return response.data;
};

export const getCurrentUserProfile = async () => {
  const response = await api.get<CurrentUserProfileResponse>(
    `${AUTH_BASE_PATH}/me`,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const getCurrentUserSocialProfile = async () => {
  const response = await api.get<CurrentUserSocialResponse>(
    `${AUTH_BASE_PATH}/me/social`,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const updateUserInfo = async (payload: UpdateUserInfoRequest) => {
  const response = await api.patch<UpdateUserInfoResponse>(
    `${AUTH_BASE_PATH}/me`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const getLikedGames = async (payload: LikedGamesRequest = {}) => {
  const response = await api.get<RawLikedGamesResponse>(
    `${AUTH_BASE_PATH}/me/game-like`,
    createCredentialedAuthRequestConfig({
      params: payload,
    }),
  );

  return normalizeLikedGamesResponse(response.data);
};

export const unlikeLikedGame = async (gameId: number) => {
  const response = await api.delete<DeleteLikedGameResponse>(
    `/api/v1/games/${gameId}/like`,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const getProfileImagePresignedUrl = async (
  payload: ProfileImagePresignedUrlRequest,
) => {
  const response = await api.post<ProfileImagePresignedUrlResponse>(
    `${AUTH_BASE_PATH}/me/profile-image/presigned-url`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const uploadFileToS3 = async ({
  presigned_url,
  file,
  content_type,
}: UploadFileToS3Request) => {
  const resolvedContentType = content_type?.trim() || file.type.trim();

  try {
    const uploadResponse = await fetch(presigned_url, {
      method: 'PUT',
      body: file,
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store',
      headers: resolvedContentType
        ? {
            'Content-Type': resolvedContentType,
          }
        : undefined,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        '프로필 이미지를 업로드하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      const normalizedMessage = error.message.trim().toLowerCase();

      if (
        normalizedMessage === 'failed to fetch' ||
        normalizedMessage.includes('networkerror')
      ) {
        throw new Error(
          '프로필 이미지 업로드 중 네트워크 또는 CORS 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      }
    }

    throw error;
  }
};

export const confirmProfileImage = async (
  payload: ConfirmProfileImageRequest,
) => {
  const response = await api.patch<ConfirmProfileImageResponse>(
    `${AUTH_BASE_PATH}/me/profile-image`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const changePassword = async (payload: ChangePasswordRequest) => {
  const response = await api.post<ChangePasswordResponse>(
    `${AUTH_BASE_PATH}/me/change-password`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const checkPassword = async (payload: CheckPasswordRequest) => {
  const response = await api.post<CheckPasswordResponse>(
    `${AUTH_BASE_PATH}/me/check-password`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const deleteAccount = async () => {
  await api.delete(
    `${AUTH_BASE_PATH}/me`,
    createCredentialedAuthRequestConfig(),
  );
};

export const signup = async (payload: SignupRequest) => {
  const response = await api.post<SignupResponse>(
    `${AUTH_BASE_PATH}/signup`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const checkIdDuplicate = async (payload: CheckIdDuplicateRequest) => {
  const response = await api.post<DuplicateCheckResponse>(
    `${AUTH_BASE_PATH}/check-id`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};

export const checkNicknameDuplicate = async (
  payload: CheckNicknameDuplicateRequest,
) => {
  const response = await api.post<DuplicateCheckResponse>(
    `${AUTH_BASE_PATH}/check-nickname`,
    payload,
    createCredentialedAuthRequestConfig(),
  );

  return response.data;
};
