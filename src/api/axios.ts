import axios from 'axios';

import { apiBaseUrl } from '../lib/env';
import { getAccessToken } from '../utils/auth';

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 7000,
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
    console.error('API 에러 발생:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);
