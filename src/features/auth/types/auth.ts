export type AuthGender = 'M' | 'W';
export type SocialAuthProvider = 'google' | 'kakao' | 'naver';

export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string | null;
}

export interface RefreshAccessTokenResponse {
  access_token: string;
}

export interface LogoutResponse {
  detail: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_check: string;
}

export interface ChangePasswordResponse {
  detail: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface DeleteLikedGameResponse {
  detail: string;
}

export interface LikedGamesRequest {
  page?: number;
  page_size?: number;
}

export interface LikedGameItemResponse {
  game_id: number;
  game_title: string;
  thumbnail_url: string | null;
  genres: string[];
  liked_at: string;
}

export interface LikedGamesResponse {
  count: number;
  results: LikedGameItemResponse[];
}

export interface CurrentUserProfileResponse {
  login_id: string;
  name: string;
  nickname: string;
  gender: AuthGender;
  email?: string | null;
  profile_img_url?: string | null;
}

export interface UpdateUserInfoRequest {
  nickname?: string;
  profile_img_url?: string;
}

export interface ProfileImagePresignedUrlRequest {
  file_name: string;
  content_type: string;
}

export interface ProfileImagePresignedUrlResponse {
  presigned_url: string;
  img_url: string;
  key: string;
}

export interface ConfirmProfileImageRequest {
  profile_img_url: string;
}

export interface ConfirmProfileImageResponse {
  detail?: string;
  profile_img_url?: string;
}

export interface UploadFileToS3Request {
  presigned_url: string;
  file: File | Blob;
  content_type?: string;
}

export interface SignupRequest {
  login_id: string;
  password_check: string;
  name: string;
  nickname: string;
  password: string;
  gender: AuthGender;
}

export interface SignupResponse {
  detail: string;
}

export interface CheckNicknameDuplicateRequest {
  nickname: string;
}

export interface CheckIdDuplicateRequest {
  login_id: string;
}

export interface DuplicateCheckResponse {
  detail: string;
}

export type { ErrorResponseBody } from './api';
