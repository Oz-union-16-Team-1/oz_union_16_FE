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
  SocialAuthProvider,
  SignupRequest,
} from '../types/auth';
import { createMockUserMap, type MockUserRecord } from './mockUsers';

const mockUsers = createMockUserMap();
const AUTH_CALLBACK_PATH = '/callback';

const validGenders: AuthGender[] = ['M', 'W'];

const createAccessToken = (loginId: string) => `mock-access-token-${loginId}`;
const createRefreshToken = (loginId: string) => `mock-refresh-token-${loginId}`;
let refreshSessionLoginId: string | null = null;
let pendingSocialLoginId: string | null = null;

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

const getDevLoginAccounts = () =>
  [...mockUsers.values()]
    .sort((a, b) => a.id - b.id)
    .map(({ loginId, password, name, nickname, gender, note }) => ({
      loginId,
      password,
      name,
      nickname,
      gender,
      note,
    }));

const isSocialAuthProvider = (value: string): value is SocialAuthProvider =>
  value === 'google' || value === 'kakao' || value === 'naver';

const getMockSocialLoginId = (provider: SocialAuthProvider) => {
  if (provider === 'naver') {
    return 'pgti-tester';
  }

  return 'pgti-demo';
};

const loginHandlers = [
  http.get(`${AUTH_BASE_PATH}/dev-login-accounts`, async () => {
    await delay(120);

    return HttpResponse.json({
      accounts: getDevLoginAccounts(),
    });
  }),

  http.get(`${AUTH_BASE_PATH}/social-login/:provider`, async ({ params }) => {
    const provider =
      typeof params.provider === 'string' ? params.provider.trim() : '';

    if (!isSocialAuthProvider(provider)) {
      return HttpResponse.json(
        {
          error_detail: '지원하지 않는 소셜 로그인 제공자입니다.',
        },
        { status: 404 },
      );
    }

    pendingSocialLoginId = getMockSocialLoginId(provider);

    await delay(120);

    return new HttpResponse(null, {
      status: 302,
      headers: {
        Location: AUTH_CALLBACK_PATH,
      },
    });
  }),

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
    refreshSessionLoginId = user.loginId;

    return HttpResponse.json({
      access_token: createAccessToken(user.loginId),
      refresh_token: createRefreshToken(user.loginId),
    });
  }),

  http.post(`${AUTH_BASE_PATH}/token/refresh`, async () => {
    const loginId = pendingSocialLoginId ?? refreshSessionLoginId;

    if (!loginId) {
      return HttpResponse.json(
        {
          error_detail: '로그인 세션이 만료되었습니다.',
        },
        { status: 403 },
      );
    }

    pendingSocialLoginId = null;
    refreshSessionLoginId = loginId;

    await delay(180);

    return HttpResponse.json({
      access_token: createAccessToken(loginId),
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

    if (password.length < 8) {
      return getFieldValidationError(
        'password',
        '비밀번호는 8자 이상이어야 합니다.',
      );
    }

    if (password !== passwordCheck) {
      return getFieldValidationError(
        'password_check',
        '비밀번호가 일치하지 않습니다.',
      );
    }

    if (mockUsers.has(loginId)) {
      return getDuplicateError('이미 사용 중인 아이디입니다.');
    }

    if (findUserByNickname(nickname)) {
      return getDuplicateError('이미 사용 중인 닉네임입니다.');
    }

    const newUser: MockUserRecord = {
      id: mockUsers.size + 1,
      loginId,
      password,
      name,
      nickname,
      gender,
      note: 'MSW 회원가입으로 생성된 테스트 계정',
    };

    mockUsers.set(loginId, newUser);

    await delay(450);

    return HttpResponse.json({
      detail: '회원가입이 완료되었습니다.',
    });
  }),

  http.post(`${AUTH_BASE_PATH}/check-id`, async ({ request }) => {
    const body = (await request.json()) as CheckIdDuplicateRequest;
    const loginId = body.login_id.trim();

    if (!loginId) {
      return getFieldValidationError(
        'login_id',
        '"login_id"이 필드는 필수 항목입니다.',
      );
    }

    await delay(150);

    if (mockUsers.has(loginId)) {
      return getDuplicateError('이미 사용 중인 아이디입니다.');
    }

    return HttpResponse.json({
      detail: '사용 가능한 아이디입니다.',
    });
  }),

  http.post(`${AUTH_BASE_PATH}/check-nickname`, async ({ request }) => {
    const body = (await request.json()) as CheckNicknameDuplicateRequest;
    const nickname = body.nickname.trim();

    if (!nickname) {
      return getFieldValidationError(
        'nickname',
        '"nickname"이 필드는 필수 항목입니다.',
      );
    }

    await delay(150);

    if (findUserByNickname(nickname)) {
      return getDuplicateError('이미 사용 중인 닉네임입니다.');
    }

    return HttpResponse.json({
      detail: '사용 가능한 닉네임입니다.',
    });
  }),
];

const accountHandlers = [
  http.get(`${AUTH_BASE_PATH}/me`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    await delay(180);

    const responseBody: CurrentUserProfileResponse = {
      login_id: user.loginId,
      name: user.name,
      nickname: user.nickname,
      gender: user.gender,
    };

    return HttpResponse.json(responseBody);
  }),

  http.post(`${AUTH_BASE_PATH}/change-password`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const body = (await request.json()) as ChangePasswordRequest;
    const currentPassword = body.current_password.trim();
    const nextPassword = body.new_password.trim();
    const nextPasswordConfirm = body.new_password_confirm.trim();

    if (!currentPassword) {
      return getFieldValidationError(
        'current_password',
        '"current_password"이 필드는 필수 항목입니다.',
      );
    }

    if (!nextPassword) {
      return getFieldValidationError(
        'new_password',
        '"new_password"이 필드는 필수 항목입니다.',
      );
    }

    if (!nextPasswordConfirm) {
      return getFieldValidationError(
        'new_password_confirm',
        '"new_password_confirm"이 필드는 필수 항목입니다.',
      );
    }

    if (user.password !== currentPassword) {
      return HttpResponse.json(
        {
          error_detail: '현재 비밀번호가 올바르지 않습니다.',
        },
        { status: 400 },
      );
    }

    if (nextPassword.length < 8) {
      return getFieldValidationError(
        'new_password',
        '비밀번호는 8자 이상이어야 합니다.',
      );
    }

    if (nextPassword !== nextPasswordConfirm) {
      return getFieldValidationError(
        'new_password_confirm',
        '비밀번호가 일치하지 않습니다.',
      );
    }

    user.password = nextPassword;

    await delay(240);

    return HttpResponse.json({
      detail: '비밀번호가 변경되었습니다.',
    } satisfies ChangePasswordResponse);
  }),

  http.post(`${AUTH_BASE_PATH}/delete-account`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    mockUsers.delete(user.loginId);

    await delay(220);

    return HttpResponse.json({
      detail: '회원 탈퇴가 완료되었습니다.',
    } satisfies DeleteAccountResponse);
  }),
];

const logoutHandlers = [
  http.post(`${AUTH_BASE_PATH}/logout`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    await delay(200);
    refreshSessionLoginId = null;
    pendingSocialLoginId = null;

    return HttpResponse.json({
      detail: '로그아웃 되었습니다.',
    } satisfies LogoutResponse);
  }),
];

export const authHandlers = [
  ...loginHandlers,
  ...signupHandlers,
  ...accountHandlers,
  ...logoutHandlers,
];
