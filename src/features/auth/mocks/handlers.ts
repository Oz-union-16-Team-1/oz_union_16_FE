import { delay, http, HttpResponse } from 'msw';

import type {
  AuthGender,
  AuthUser,
  LoginRequest,
  SignupRequest,
} from '../types/auth';

type MockUserRecord = AuthUser & {
  loginId: string;
  password: string;
};

const AUTH_BASE_PATH = '/api/v1/auth';

const mockUsers = new Map<string, MockUserRecord>([
  [
    'pgti-demo',
    {
      id: 1,
      loginId: 'pgti-demo',
      password: 'demo1234',
      name: 'PGTI 데모',
      nickname: '데모유저',
      gender: 'UNSPECIFIED',
    },
  ],
  [
    'already-used',
    {
      id: 2,
      loginId: 'already-used',
      password: 'demo1234',
      name: '기존 사용자',
      nickname: '중복닉네임',
      gender: 'FEMALE',
    },
  ],
]);

const validGenders: AuthGender[] = ['UNSPECIFIED', 'MALE', 'FEMALE'];

const createAccessToken = (loginId: string) => `mock-access-token-${loginId}`;

const getDuplicateError = (message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status: 409 },
  );

const getValidationError = (message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status: 400 },
  );

const getUnauthorizedError = (message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status: 401 },
  );

const findUserByNickname = (nickname: string) =>
  [...mockUsers.values()].find((user) => user.nickname === nickname);

export const authHandlers = [
  http.post(`${AUTH_BASE_PATH}/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const loginId = body.id.trim();
    const password = body.password.trim();

    if (!loginId || !password) {
      return getValidationError('아이디와 비밀번호를 입력해 주세요.');
    }

    const user = mockUsers.get(loginId);

    if (!user || user.password !== password) {
      return getUnauthorizedError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    await delay(500);

    return HttpResponse.json({
      access_token: createAccessToken(user.loginId),
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        gender: user.gender,
      },
    });
  }),

  http.post(`${AUTH_BASE_PATH}/signup`, async ({ request }) => {
    const body = (await request.json()) as SignupRequest;
    const loginId = body.id.trim();
    const name = body.name.trim();
    const nickname = body.nickname.trim();
    const password = body.password.trim();
    const gender = body.gender;

    if (!loginId || !name || !nickname || !password) {
      return getValidationError('필수 입력값을 모두 입력해 주세요.');
    }

    if (!validGenders.includes(gender)) {
      return getValidationError('올바른 성별 값을 선택해 주세요.');
    }

    if (mockUsers.has(loginId)) {
      return getDuplicateError('이미 사용 중인 아이디입니다.');
    }

    if (findUserByNickname(nickname)) {
      return getDuplicateError('이미 사용 중인 닉네임입니다.');
    }

    const createdUser: MockUserRecord = {
      id: mockUsers.size + 1,
      loginId,
      password,
      name,
      nickname,
      gender,
    };

    mockUsers.set(loginId, createdUser);

    await delay(600);

    return HttpResponse.json({
      access_token: createAccessToken(createdUser.loginId),
      user: {
        id: createdUser.id,
        name: createdUser.name,
        nickname: createdUser.nickname,
        gender: createdUser.gender,
      },
    });
  }),

  http.get(`${AUTH_BASE_PATH}/check-id`, async ({ request }) => {
    const url = new URL(request.url);
    const value = url.searchParams.get('value')?.trim() ?? '';

    if (!value) {
      return getValidationError('확인할 아이디를 입력해 주세요.');
    }

    await delay(250);

    return HttpResponse.json({
      available: !mockUsers.has(value),
      message: mockUsers.has(value)
        ? '이미 사용 중인 아이디입니다.'
        : '사용 가능한 아이디입니다.',
    });
  }),

  http.get(`${AUTH_BASE_PATH}/check-nickname`, async ({ request }) => {
    const url = new URL(request.url);
    const value = url.searchParams.get('value')?.trim() ?? '';

    if (!value) {
      return getValidationError('확인할 닉네임을 입력해 주세요.');
    }

    await delay(250);

    const isDuplicate = Boolean(findUserByNickname(value));

    return HttpResponse.json({
      available: !isDuplicate,
      message: isDuplicate
        ? '이미 사용 중인 닉네임입니다.'
        : '사용 가능한 닉네임입니다.',
    });
  }),
];
