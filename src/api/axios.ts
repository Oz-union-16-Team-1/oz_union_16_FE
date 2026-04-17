import axios from 'axios';

import { apiBaseUrl } from '../lib/env';
import { clearAuthTokens, getAccessToken } from '../utils/auth';

const AUTH_EXCLUDED_PATHS = [
  '/api/v1/accounts/login',
  '/api/v1/accounts/signup',
  '/api/v1/accounts/check-id',
  '/api/v1/accounts/check-nickname',
];

const shouldResetAuthSession = (requestUrl?: string) => {
  if (!requestUrl) {
    return true;
  }

  return !AUTH_EXCLUDED_PATHS.some((path) => requestUrl.includes(path));
};

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 7000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      getAccessToken() &&
      shouldResetAuthSession(error.config?.url)
    ) {
      // Refresh cookie handling will be added when the backend refresh contract is fixed.
      clearAuthTokens();
    }

    console.error('API 에러 발생:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);
