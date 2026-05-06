import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { api } from '@/api/axios';
import { configuredApiBaseUrl } from '@/lib/env';
import { normalizeThumbnailUrl } from '@/lib/normalizeThumbnailUrl';
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
  LikedGameItemResponse,
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
const REFRESH_REQUEST_THROTTLE_MS = 1500;
const REFRESH_RETRY_AFTER_THROTTLED_FAILURE_MS = 900;
const REFRESH_REQUEST_THROTTLE_STORAGE_KEY =
  'auth-refresh-request-last-started-at';
const FALLBACK_BACKEND_ORIGIN = 'https://oz-pgti.duckdns.org';

const loginRequestPath = `${AUTH_BASE_PATH}/login`;
const logoutRequestPath = `${AUTH_BASE_PATH}/logout`;
const refreshRequestPath = `${AUTH_BASE_PATH}/token/refresh`;

type RefreshAccessTokenRequestOptions = {
  preferDirectBackendOriginInDev?: boolean;
};

const resolveRefreshRequestUrl = (
  options: RefreshAccessTokenRequestOptions = {},
) => {
  if (import.meta.env.DEV && !options.preferDirectBackendOriginInDev) {
    return refreshRequestPath;
  }

  const backendOrigin = configuredApiBaseUrl || FALLBACK_BACKEND_ORIGIN;

  return `${backendOrigin}${refreshRequestPath}`;
};

const readRefreshThrottleTimestamp = () => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const rawValue = window.sessionStorage.getItem(
    REFRESH_REQUEST_THROTTLE_STORAGE_KEY,
  );
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

const markRefreshThrottleTimestamp = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    REFRESH_REQUEST_THROTTLE_STORAGE_KEY,
    String(Date.now()),
  );
};

const waitForRefreshThrottleWindow = async () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const lastStartedAt = readRefreshThrottleTimestamp();

  if (!lastStartedAt) {
    return false;
  }

  const elapsed = Date.now() - lastStartedAt;
  const remaining = REFRESH_REQUEST_THROTTLE_MS - elapsed;

  if (remaining <= 0) {
    return false;
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });

  return true;
};

const isRetryableRefreshThrottleFailure = (error: unknown) =>
  error instanceof AxiosError &&
  (error.response?.status === 401 || error.response?.status === 403);

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

const normalizeLikedGameText = (
  value: string | null | undefined,
  fallback = 'N/A',
) => {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  return trimmedValue || fallback;
};

const normalizeLikedGameGenres = (
  genres: RawLikedGameItemResponse['genres'] | null | undefined,
) => {
  if (Array.isArray(genres)) {
    return genres
      .map((genre) => (typeof genre === 'string' ? genre.trim() : ''))
      .filter((genre) => genre.length > 0);
  }

  if (typeof genres === 'string') {
    return genres
      .split(',')
      .map((genre) => genre.trim())
      .filter((genre) => genre.length > 0);
  }

  return [];
};

const normalizeLikedGameItem = (
  item: RawLikedGameItemResponse | null | undefined,
): LikedGameItemResponse => ({
  game_id:
    typeof item?.game_id === 'number' && Number.isInteger(item.game_id)
      ? item.game_id
      : 0,
  game_title: normalizeLikedGameText(item?.game_title),
  thumbnail_url: normalizeThumbnailUrl(item?.thumbnail_url),
  genres: normalizeLikedGameGenres(item?.genres),
  liked_at: typeof item?.liked_at === 'string' ? item.liked_at : '',
});

const normalizeLikedGamesResponse = (
  response: RawLikedGamesResponse | null | undefined,
): LikedGamesResponse => ({
  count:
    typeof response?.count === 'number'
      ? response.count
      : Array.isArray(response?.results)
        ? response.results.length
        : 0,
  results: Array.isArray(response?.results)
    ? response.results.map(normalizeLikedGameItem)
    : [],
});

export const requestLogin = async (payload: LoginRequest) => {
  const requestConfig = createCredentialedAuthRequestConfig();

  logCredentialedAuthRequestDiagnostics({
    label: 'login',
    requestUrl: loginRequestPath,
    withCredentials: true,
  });

  const response = await api.post<LoginResponse>(
    loginRequestPath,
    payload,
    requestConfig,
  );

  return response.data;
};

export const requestLogout = async () => {
  const requestConfig = createCredentialedAuthRequestConfig();

  logCredentialedAuthRequestDiagnostics({
    label: 'logout',
    requestUrl: logoutRequestPath,
    withCredentials: true,
  });

  const response = await api.post<LogoutResponse>(
    logoutRequestPath,
    undefined,
    requestConfig,
  );

  return response.data;
};

export const requestRefreshAccessToken = async (
  payload: { refresh_token?: string } = {},
  options: RefreshAccessTokenRequestOptions = {},
) => {
  const waitedForPreviousRefresh = await waitForRefreshThrottleWindow();
  const requestConfig = createCredentialedAuthRequestConfig();
  const requestBody = payload.refresh_token?.trim() ? payload : undefined;
  const refreshRequestUrl = resolveRefreshRequestUrl(options);

  logCredentialedAuthRequestDiagnostics({
    label: 'refresh',
    requestUrl: refreshRequestUrl,
    withCredentials: true,
  });

  const sendRefreshRequest = async () => {
    markRefreshThrottleTimestamp();

    // Development usually uses the Vite proxy via a relative path, but the
    // local social-login callback may need one direct backend refresh so the
    // backend-domain cookie can be consumed before proxy-based API calls resume.
    const response = await axios.post<RefreshAccessTokenResponse>(
      refreshRequestUrl,
      requestBody,
      requestConfig,
    );

    return response.data;
  };

  try {
    return await sendRefreshRequest();
  } catch (error) {
    if (
      waitedForPreviousRefresh &&
      isRetryableRefreshThrottleFailure(error) &&
      typeof window !== 'undefined'
    ) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, REFRESH_RETRY_AFTER_THROTTLED_FAILURE_MS);
      });

      return sendRefreshRequest();
    }

    throw error;
  }
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
  const requestBody: ConfirmProfileImageRequest = {
    profile_img_url: payload.profile_img_url.trim(),
  };

  const response = await api.put<ConfirmProfileImageResponse>(
    `${AUTH_BASE_PATH}/me/profile-image`,
    requestBody,
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
  await api.post<CheckPasswordResponse>(
    `${AUTH_BASE_PATH}/me/check-password`,
    payload,
    createCredentialedAuthRequestConfig(),
  );
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
