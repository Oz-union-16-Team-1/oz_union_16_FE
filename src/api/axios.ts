import axios from 'axios';

export const api = axios.create({
  // 나중에 진짜 주소 넣는곳
  baseURL: 'https://api.example.com',
  timeout: 5000, // 5초 넘으면 연결 끊기
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청(Request) 인터셉터
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답(Response) 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 에러 발생:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);
