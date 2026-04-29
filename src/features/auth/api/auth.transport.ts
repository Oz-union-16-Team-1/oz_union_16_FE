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
    `${AUTH_BASE_PATH}/me/game-like/${gameId}`,
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
  const resolvedContentType =
    content_type || file.type || 'application/octet-stream';

  await axios.put(presigned_url, file, {
    headers: {
      'Content-Type': resolvedContentType,
    },
    withCredentials: false,
  });
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
