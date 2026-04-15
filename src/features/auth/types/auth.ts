export type AuthGender = 'UNSPECIFIED' | 'MALE' | 'FEMALE';

export interface AuthUser {
  id: number;
  name: string;
  nickname: string;
  gender: AuthGender;
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface SignupRequest {
  name: string;
  id: string;
  nickname: string;
  password: string;
  gender: AuthGender;
}

export interface SignupResponse {
  access_token: string;
  user: AuthUser;
}

export interface DuplicateCheckResponse {
  available: boolean;
  message: string;
}
