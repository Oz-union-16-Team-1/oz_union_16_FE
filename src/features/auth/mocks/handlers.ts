import { delay, http, HttpResponse } from 'msw';

import { AUTH_BASE_PATH } from '../constants/auth';
import type {
  AuthGender,
  CheckIdDuplicateRequest,
  CheckNicknameDuplicateRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CurrentUserProfileResponse,
  DeleteAccountResponse,
  LoginRequest,
  LogoutResponse,
  SignupRequest,
} from '../types/auth';
import { createMockUserMap, type MockUserRecord } from './mockUsers';

const mockUsers = createMockUserMap();

const validGenders: AuthGender[] = ['M', 'W'];

const createAccessToken = (loginId: string) => `mock-access-token-${loginId}`;
const createRefreshToken = (loginId: string) => `mock-refresh-token-${loginId}`;

const getAuthorizedUser = (authorization: string | null) => {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.replace('Bearer ', '').trim();
  const loginId = token.replace(/^mock-access-token-/, '');

  if (!loginId || loginId === token) {
    return null;
  }

  return mockUsers.get(loginId) ?? null;
};

const getDuplicateError = (message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status: 409 },
  );

const getFieldValidationError = (fieldName: string, message: string) =>
  HttpResponse.json(
    {
      detail: {
        [fieldName]: [message],
      },
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

const loginHandlers = [
  http.post(`${AUTH_BASE_PATH}/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const loginId = body.login_id.trim();
    const password = body.password.trim();

    if (!loginId) {
      return getFieldValidationError(
        'login_id',
        '"login_id"이 필드는 필수 항목입니다.',
      );
    }

    if (!password) {
      return getFieldValidationError(
        'password',
        '"password"이 필드는 필수 항목입니다.',
      );
    }

    const user = mockUsers.get(loginId);

    if (!user || user.password !== password) {
      return getUnauthorizedError(
        '로그인 아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    await delay(500);

    return HttpResponse.json({
      access_token: createAccessToken(user.loginId),
      refresh_token: createRefreshToken(user.loginId),
    });
  }),
];

const signupHandlers = [
  http.post(`${AUTH_BASE_PATH}/signup`, async ({ request }) => {
    const body = (await request.json()) as SignupRequest;
    const loginId = body.login_id.trim();
    const name = body.name.trim();
    const nickname = body.nickname.trim();
    const password = body.password.trim();
    const passwordCheck = body.password_check.trim();
    const gender = body.gender;

    if (!loginId) {
      return getFieldValidationError(
        'login_id',
        '"login_id"이 필드는 필수 항목입니다.',
      );
    }

    if (!password) {
      return getFieldValidationError(
        'password',
        '"password"이 필드는 필수 항목입니다.',
      );
    }

    if (!passwordCheck) {
      return getFieldValidationError(
        'password_check',
        '"password_check"이 필드는 필수 항목입니다.',
      );
    }

    if (!nickname) {
      return getFieldValidationError(
        'nickname',
        '"nickname"이 필드는 필수 항목입니다.',
      );
    }

    if (!name) {
      return getFieldValidationError(
        'name',
        '"name"이 필드는 필수 항목입니다.',
      );
    }

    if (!validGenders.includes(gender)) {
      return getFieldValidationError(
        'gender',
        '"gender"이 필드는 필수 항목입니다.',
      );
    }

    if (password.length <= 8) {
      return getFieldValidationError('password', '비밀번호가 8자 이하입니다.');
    }

    if (password !== passwordCheck) {
      return getFieldValidationError(
        'password_check',
        '비밀번호와 일치하지 않습니다.',
      );
    }

    if (mockUsers.has(loginId)) {
      return getDuplicateError('이미 중복된 회원가입 내역이 존재합니다.');
    }

    if (findUserByNickname(nickname)) {
      return getDuplicateError('이미 중복된 닉네임이 존재합니다.');
    }

    const createdUser: MockUserRecord = {
      id: mockUsers.size + 1,
      loginId,
      password,
      name,
      nickname,
      gender,
      note: '회원가입 mock으로 생성된 계정',
    };

    mockUsers.set(loginId, createdUser);

    await delay(600);

    return HttpResponse.json(
      {
        detail: '회원가입이 완료되었습니다.',
      },
      { status: 201 },
    );
  }),
];

const logoutHandlers = [
  http.post(`${AUTH_BASE_PATH}/logout`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error_detail: '인증 정보가 유효하지 않거나 만료되었습니다.',
        } satisfies LogoutResponse | { error_detail: string },
        { status: 401 },
      );
    }

    await delay(200);

    return HttpResponse.json({
      detail: '로그아웃 되었습니다.',
    } satisfies LogoutResponse);
  }),
];

const accountHandlers = [
  http.get(`${AUTH_BASE_PATH}/me`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError(
        '인증 정보가 유효하지 않거나 만료되었습니다.',
      );
    }

    await delay(180);

    return HttpResponse.json({
      login_id: user.loginId,
      name: user.name,
      nickname: user.nickname,
      gender: user.gender,
    } satisfies CurrentUserProfileResponse);
  }),

  http.post(`${AUTH_BASE_PATH}/change-password`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError(
        '인증 정보가 유효하지 않거나 만료되었습니다.',
      );
    }

    const body = (await request.json()) as ChangePasswordRequest;
    const currentPassword = body.current_password.trim();
    const nextPassword = body.new_password.trim();
    const nextPasswordConfirm = body.new_password_confirm.trim();

    if (!currentPassword) {
      return getFieldValidationError(
        'current_password',
        '현재 비밀번호를 입력해주세요.',
      );
    }

    if (!nextPassword) {
      return getFieldValidationError(
        'new_password',
        '새 비밀번호를 입력해주세요.',
      );
    }

    if (!nextPasswordConfirm) {
      return getFieldValidationError(
        'new_password_confirm',
        '새 비밀번호를 한번 더 입력해주세요.',
      );
    }

    if (user.password !== currentPassword) {
      return getFieldValidationError(
        'current_password',
        '현재 비밀번호가 일치하지 않습니다.',
      );
    }

    if (nextPassword.length <= 8) {
      return getFieldValidationError(
        'new_password',
        '비밀번호가 8자 이하입니다.',
      );
    }

    if (nextPassword !== nextPasswordConfirm) {
      return getFieldValidationError(
        'new_password_confirm',
        '비밀번호와 일치하지 않습니다.',
      );
    }

    user.password = nextPassword;

    await delay(350);

    return HttpResponse.json({
      detail: '비밀번호가 변경되었습니다.',
    } satisfies ChangePasswordResponse);
  }),

  http.post(`${AUTH_BASE_PATH}/delete-account`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError(
        '인증 정보가 유효하지 않거나 만료되었습니다.',
      );
    }

    await delay(400);

    mockUsers.delete(user.loginId);

    return HttpResponse.json({
      detail: `${user.nickname} 계정이 탈퇴 처리되었습니다.`,
    } satisfies DeleteAccountResponse);
  }),
];

const duplicateCheckHandlers = [
  http.post(`${AUTH_BASE_PATH}/check-id`, async ({ request }) => {
    const body = (await request.json()) as CheckIdDuplicateRequest;
    const value = body.login_id.trim();

    if (!value) {
      return getFieldValidationError(
        'login_id',
        '"login_id"이 필드는 필수 항목입니다.',
      );
    }

    await delay(250);

    if (mockUsers.has(value)) {
      return getDuplicateError('중복된 아이디가 존재합니다.');
    }

    return HttpResponse.json({
      detail: '사용가능한 아이디 입니다.',
    });
  }),

  http.post(`${AUTH_BASE_PATH}/check-nickname`, async ({ request }) => {
    const body = (await request.json()) as CheckNicknameDuplicateRequest;
    const value = body.nickname.trim();

    if (!value) {
      return getFieldValidationError(
        'nickname',
        '"nickname"이 필드는 필수 항목입니다.',
      );
    }

    await delay(250);

    const isDuplicate = Boolean(findUserByNickname(value));

    if (isDuplicate) {
      return getDuplicateError('중복된 닉네임이 존재합니다.');
    }

    return HttpResponse.json({
      detail: '사용가능한 닉네임 입니다.',
    });
  }),
];

export const authHandlers = [
  ...loginHandlers,
  ...signupHandlers,
  ...logoutHandlers,
  ...accountHandlers,
  ...duplicateCheckHandlers,
];
