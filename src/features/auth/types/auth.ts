export type AuthGender = 'M' | 'W';

export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface LogoutResponse {
  detail: string;
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
