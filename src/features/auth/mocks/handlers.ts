import { delay, http, HttpResponse } from 'msw';

import { ROUTE_PATHS } from '../../../constants/routes';
import { AUTH_BASE_PATH } from '../constants/auth';
import { mockGameDetails } from '../../games/mockGameDetails';
import { mockTopGames } from '../../games/mockGames';
import type { RawGameLikeResponse } from '../../games/types';
import type {
  AuthGender,
  CheckIdDuplicateRequest,
  CheckNicknameDuplicateRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ConfirmProfileImageRequest,
  ConfirmProfileImageResponse,
  CurrentUserProfileResponse,
  DeleteAccountRequest,
  DeleteLikedGameResponse,
  LikedGameItemResponse,
  LikedGamesResponse,
  LoginRequest,
  LogoutResponse,
  ProfileImagePresignedUrlRequest,
  ProfileImagePresignedUrlResponse,
  SocialAuthProvider,
  SignupRequest,
  UpdateUserInfoRequest,
  UpdateUserInfoResponse,
} from '../types/auth';
import { createMockUserMap, type MockUserRecord } from './mockUsers';

const mockUsers = createMockUserMap();
const AUTH_CALLBACK_PATH = ROUTE_PATHS.AUTH_CALLBACK;

const validGenders: AuthGender[] = ['M', 'W'];

const createAccessToken = (loginId: string) => `mock-access-token-${loginId}`;
const createRefreshToken = (loginId: string) => `mock-refresh-token-${loginId}`;
const parseLoginIdFromRefreshToken = (refreshToken: string) => {
  const normalizedRefreshToken = refreshToken.trim();
  const refreshTokenPrefix = 'mock-refresh-token-';

  if (!normalizedRefreshToken.startsWith(refreshTokenPrefix)) {
    return null;
  }

  const loginId = normalizedRefreshToken.slice(refreshTokenPrefix.length);

  return loginId || null;
};
const MOCK_S3_HOST = 'https://mock-s3.oz-union-16.com';
let refreshSessionLoginId: string | null = null;
let pendingSocialLoginId: string | null = null;

const mockLikedGamesByLoginId = new Map<string, LikedGameItemResponse[]>(
  [...mockUsers.keys()].map((loginId) => [loginId, []]),
);
const mockGameLikeCountByGameId = new Map<number, number>(
  Object.values(mockGameDetails).map((detail) => [
    detail.gameId,
    detail.likeCount,
  ]),
);
const mockUploadedProfileImagesByPath = new Map<
  string,
  { contentType: string; bytes: ArrayBuffer }
>();
const mockTopGameById = new Map(
  mockTopGames.map((game) => [game.gameId, game]),
);

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

const findUserByNicknameExcludingLoginId = (
  nickname: string,
  loginId: string,
) =>
  [...mockUsers.values()].find(
    (user) => user.nickname === nickname && user.loginId !== loginId,
  );

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

const parsePositiveInteger = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
};

const sanitizeFileName = (fileName: string) => {
  const normalizedFileName = fileName.trim().replace(/\s+/g, '-');
  const safeFileName = normalizedFileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  return safeFileName || `profile-${Date.now()}.png`;
};

const getProfileImagePathKey = (loginId: string, fileName: string) =>
  `${loginId}/${fileName}`;

const getOrCreateLikedGames = (loginId: string) => {
  const likedGames = mockLikedGamesByLoginId.get(loginId);

  if (likedGames) {
    return likedGames;
  }

  const nextLikedGames: LikedGameItemResponse[] = [];
  mockLikedGamesByLoginId.set(loginId, nextLikedGames);

  return nextLikedGames;
};

const getCurrentLikeCount = (gameId: number, fallbackLikeCount = 0) =>
  Math.max(0, mockGameLikeCountByGameId.get(gameId) ?? fallbackLikeCount);

const increaseLikeCount = (gameId: number) => {
  const nextLikeCount = getCurrentLikeCount(gameId) + 1;
  mockGameLikeCountByGameId.set(gameId, nextLikeCount);

  return nextLikeCount;
};

const decreaseLikeCount = (gameId: number) => {
  const nextLikeCount = Math.max(0, getCurrentLikeCount(gameId) - 1);
  mockGameLikeCountByGameId.set(gameId, nextLikeCount);

  return nextLikeCount;
};

const createLikedGameItem = (gameId: number): LikedGameItemResponse => {
  const game = mockTopGameById.get(gameId);

  return {
    game_id: gameId,
    game_title: game?.name ?? `게임 ${gameId}`,
    thumbnail_url: game?.thumbnailUrl ?? null,
    genres: game?.genres ?? [],
    liked_at: new Date().toISOString(),
  };
};

export const syncMockLikedGamesForAuthorization = (
  authorization: string | null,
  updates: Array<{
    game_id: number;
    game_title: string;
    thumbnail_url: string | null;
    genres: string[];
    is_liked: boolean;
  }>,
) => {
  const user = getAuthorizedUser(authorization);

  if (!user || updates.length === 0) {
    return;
  }

  const likedGamesById = new Map(
    getOrCreateLikedGames(user.loginId).map((likedGame) => [
      likedGame.game_id,
      likedGame,
    ]),
  );

  updates.forEach((update) => {
    if (update.is_liked) {
      const existingLikedGame = likedGamesById.get(update.game_id);

      likedGamesById.set(update.game_id, {
        game_id: update.game_id,
        game_title:
          update.game_title.trim() ||
          existingLikedGame?.game_title ||
          `게임 ${update.game_id}`,
        thumbnail_url:
          update.thumbnail_url ?? existingLikedGame?.thumbnail_url ?? null,
        genres: update.genres.length
          ? update.genres
          : (existingLikedGame?.genres ?? []),
        liked_at: existingLikedGame?.liked_at ?? new Date().toISOString(),
      });

      return;
    }

    likedGamesById.delete(update.game_id);
  });

  const nextLikedGames = [...likedGamesById.values()].sort(
    (a, b) => Date.parse(b.liked_at) - Date.parse(a.liked_at),
  );

  mockLikedGamesByLoginId.set(user.loginId, nextLikedGames);
};

export const getMockLikedGameIdsForAuthorization = (
  authorization: string | null,
) => {
  const user = getAuthorizedUser(authorization);

  if (!user) {
    return new Set<number>();
  }

  return new Set(
    getOrCreateLikedGames(user.loginId).map((game) => game.game_id),
  );
};

export const getMockGameLikeStateForAuthorization = (
  authorization: string | null,
  gameId: number,
  fallbackLikeCount = 0,
) => {
  const user = getAuthorizedUser(authorization);

  return {
    is_liked: user
      ? getOrCreateLikedGames(user.loginId).some(
          (game) => game.game_id === gameId,
        )
      : null,
    like_count: getCurrentLikeCount(gameId, fallbackLikeCount),
  };
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

  http.post(`${AUTH_BASE_PATH}/token/refresh`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      refresh_token?: string;
    } | null;
    const requestRefreshToken =
      typeof body?.refresh_token === 'string' ? body.refresh_token.trim() : '';
    const loginIdFromRefreshToken = requestRefreshToken
      ? parseLoginIdFromRefreshToken(requestRefreshToken)
      : null;
    const loginId =
      pendingSocialLoginId ?? loginIdFromRefreshToken ?? refreshSessionLoginId;

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
      email: `${loginId}@example.com`,
      profileImageUrl: null,
      note: 'MSW 회원가입으로 생성된 테스트 계정',
    };

    mockUsers.set(loginId, newUser);
    mockLikedGamesByLoginId.set(loginId, []);

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
      email: user.email,
      profile_img_url: user.profileImageUrl,
    };

    return HttpResponse.json(responseBody);
  }),

  http.patch(`${AUTH_BASE_PATH}/me`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const body = (await request
      .json()
      .catch(() => null)) as UpdateUserInfoRequest | null;
    const hasNickname = typeof body?.nickname === 'string';
    const hasProfileImage = typeof body?.profile_img_url === 'string';

    if (!hasNickname && !hasProfileImage) {
      return HttpResponse.json(
        {
          error_detail: '수정할 정보를 전달해주세요.',
        },
        { status: 400 },
      );
    }

    if (hasNickname) {
      const nickname = body!.nickname!.trim();

      if (!nickname) {
        return getFieldValidationError(
          'nickname',
          '"nickname"이 필드는 필수 항목입니다.',
        );
      }

      if (nickname.length < 2 || nickname.length > 20) {
        return getFieldValidationError(
          'nickname',
          '닉네임은 2자 이상 20자 이하로 입력해주세요.',
        );
      }

      if (findUserByNicknameExcludingLoginId(nickname, user.loginId)) {
        return getDuplicateError('이미 사용 중인 닉네임입니다.');
      }

      user.nickname = nickname;
    }

    if (hasProfileImage) {
      const profileImageUrl = body!.profile_img_url!.trim();

      if (!profileImageUrl) {
        return getFieldValidationError(
          'profile_img_url',
          '"profile_img_url"이 필드는 필수 항목입니다.',
        );
      }

      user.profileImageUrl = profileImageUrl;
    }

    await delay(180);

    const responseBody: UpdateUserInfoResponse = {
      detail: '회원 정보가 수정되었습니다.',
    };

    if (hasNickname) {
      responseBody.nickname = user.nickname;
    }

    if (hasProfileImage) {
      responseBody.profile_img_url = user.profileImageUrl;
    }

    return HttpResponse.json(responseBody);
  }),

  http.post(
    `${AUTH_BASE_PATH}/me/profile-image/presigned-url`,
    async ({ request }) => {
      const authorization = request.headers.get('Authorization');
      const user = getAuthorizedUser(authorization);

      if (!user) {
        return getUnauthorizedError('로그인이 필요합니다.');
      }

      const body = (await request.json()) as ProfileImagePresignedUrlRequest;
      const fileName = body.file_name.trim();
      const contentType = body.content_type.trim();

      if (!fileName) {
        return getFieldValidationError(
          'file_name',
          '"file_name"이 필드는 필수 항목입니다.',
        );
      }

      if (!contentType) {
        return getFieldValidationError(
          'content_type',
          '"content_type"이 필드는 필수 항목입니다.',
        );
      }

      const uploadFileName = `${Date.now()}-${sanitizeFileName(fileName)}`;
      const fileKey = getProfileImagePathKey(user.loginId, uploadFileName);
      const responseBody: ProfileImagePresignedUrlResponse = {
        presigned_url: `${MOCK_S3_HOST}/upload/${user.loginId}/${uploadFileName}`,
        img_url: `${MOCK_S3_HOST}/public/${user.loginId}/${uploadFileName}`,
        key: fileKey,
      };

      await delay(100);

      return HttpResponse.json(responseBody);
    },
  ),

  http.get(`${AUTH_BASE_PATH}/me/game-like`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const requestUrl = new URL(request.url);
    const page = parsePositiveInteger(requestUrl.searchParams.get('page'), 1);
    const pageSize = Math.min(
      parsePositiveInteger(requestUrl.searchParams.get('page_size'), 20),
      20,
    );
    const likedGames = getOrCreateLikedGames(user.loginId);
    const startIndex = (page - 1) * pageSize;
    const pagedResults = likedGames.slice(startIndex, startIndex + pageSize);

    await delay(200);

    return HttpResponse.json({
      count: likedGames.length,
      results: pagedResults,
    } satisfies LikedGamesResponse);
  }),

  http.put(
    `${MOCK_S3_HOST}/upload/:loginId/:fileName`,
    async ({ request, params }) => {
      const loginId = typeof params.loginId === 'string' ? params.loginId : '';
      const fileName =
        typeof params.fileName === 'string' ? params.fileName : '';
      const user = mockUsers.get(loginId);

      if (user && fileName) {
        const bytes = await request.arrayBuffer();
        const contentType =
          request.headers.get('Content-Type') || 'application/octet-stream';
        const imageKey = getProfileImagePathKey(loginId, fileName);

        mockUploadedProfileImagesByPath.set(imageKey, {
          bytes,
          contentType,
        });
      }

      await delay(120);

      return new HttpResponse(null, { status: 200 });
    },
  ),

  http.patch(`${AUTH_BASE_PATH}/me/profile-image`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const body = (await request.json()) as ConfirmProfileImageRequest;
    const profileImageUrl = body.profile_img_url.trim();

    if (!profileImageUrl) {
      return getFieldValidationError(
        'profile_img_url',
        '"profile_img_url"이 필드는 필수 항목입니다.',
      );
    }

    const urlPrefix = `${MOCK_S3_HOST}/public/${user.loginId}/`;

    if (!profileImageUrl.startsWith(urlPrefix)) {
      return getFieldValidationError(
        'profile_img_url',
        '유효한 프로필 이미지 경로를 전달해주세요.',
      );
    }

    const uploadedFileName = profileImageUrl.slice(urlPrefix.length);
    const uploadedImageKey = getProfileImagePathKey(
      user.loginId,
      uploadedFileName,
    );

    if (!mockUploadedProfileImagesByPath.has(uploadedImageKey)) {
      return HttpResponse.json(
        {
          error_detail: '업로드된 프로필 이미지를 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    user.profileImageUrl = profileImageUrl;

    await delay(120);

    return HttpResponse.json({
      detail: '프로필 이미지가 변경되었습니다.',
      profile_img_url: profileImageUrl,
    } satisfies ConfirmProfileImageResponse);
  }),

  http.get(`${MOCK_S3_HOST}/public/:loginId/:fileName`, async ({ params }) => {
    const loginId = typeof params.loginId === 'string' ? params.loginId : '';
    const fileName = typeof params.fileName === 'string' ? params.fileName : '';
    const imageKey = getProfileImagePathKey(loginId, fileName);
    const uploadedImage = mockUploadedProfileImagesByPath.get(imageKey);

    if (!uploadedImage) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(uploadedImage.bytes, {
      status: 200,
      headers: {
        'Content-Type': uploadedImage.contentType,
      },
    });
  }),

  http.delete(
    `${AUTH_BASE_PATH}/me/game-like/:gameId`,
    async ({ request, params }) => {
      const authorization = request.headers.get('Authorization');
      const user = getAuthorizedUser(authorization);

      if (!user) {
        return getUnauthorizedError('로그인이 필요합니다.');
      }

      const gameIdParam =
        typeof params.gameId === 'string' ? params.gameId.trim() : '';
      const gameId = Number(gameIdParam);

      if (!Number.isInteger(gameId) || gameId <= 0) {
        return getFieldValidationError(
          'game_id',
          '유효한 게임 ID를 전달해주세요.',
        );
      }

      const likedGames = getOrCreateLikedGames(user.loginId);
      const nextLikedGames = likedGames.filter(
        (game) => game.game_id !== gameId,
      );

      if (nextLikedGames.length === likedGames.length) {
        return HttpResponse.json(
          {
            error_detail: '찜한 게임을 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      mockLikedGamesByLoginId.set(user.loginId, nextLikedGames);
      decreaseLikeCount(gameId);

      await delay(200);

      return HttpResponse.json({
        detail: '찜한 게임이 목록에서 삭제되었습니다.',
      } satisfies DeleteLikedGameResponse);
    },
  ),

  http.post(`${AUTH_BASE_PATH}/me/change-password`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const body = (await request.json()) as ChangePasswordRequest;
    const currentPassword = body.old_password.trim();
    const nextPassword = body.new_password.trim();
    const nextPasswordConfirm = body.new_password_check.trim();

    if (!currentPassword) {
      return getFieldValidationError(
        'old_password',
        '"old_password"이 필드는 필수 항목입니다.',
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
        'new_password_check',
        '"new_password_check"이 필드는 필수 항목입니다.',
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
        'new_password_check',
        '비밀번호가 일치하지 않습니다.',
      );
    }

    user.password = nextPassword;

    await delay(240);

    return HttpResponse.json({
      detail: '비밀번호가 변경되었습니다.',
    } satisfies ChangePasswordResponse);
  }),

  http.delete(`${AUTH_BASE_PATH}/me`, async ({ request }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const body = (await request.json().catch(() => ({}))) as
      | DeleteAccountRequest
      | Record<string, unknown>;
    const password =
      typeof body.password === 'string' ? body.password.trim() : '';

    if (!password) {
      return getFieldValidationError(
        'password',
        '"password"이 필드는 필수 항목입니다.',
      );
    }

    if (user.password !== password) {
      return HttpResponse.json(
        {
          error_detail: '현재 비밀번호가 올바르지 않습니다.',
        },
        { status: 400 },
      );
    }

    mockUsers.delete(user.loginId);
    mockLikedGamesByLoginId.delete(user.loginId);
    [...mockUploadedProfileImagesByPath.keys()]
      .filter((key) => key.startsWith(`${user.loginId}/`))
      .forEach((key) => {
        mockUploadedProfileImagesByPath.delete(key);
      });

    await delay(220);

    return new HttpResponse(null, { status: 204 });
  }),
];

const gameLikeHandlers = [
  http.post('/api/v1/games/:gameId/like', async ({ request, params }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const gameIdParam =
      typeof params.gameId === 'string' ? params.gameId.trim() : '';
    const gameId = Number(gameIdParam);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return getFieldValidationError(
        'game_id',
        '유효한 게임 ID를 전달해주세요.',
      );
    }

    const likedGames = getOrCreateLikedGames(user.loginId);
    const alreadyLiked = likedGames.some((game) => game.game_id === gameId);

    if (!alreadyLiked) {
      likedGames.unshift(createLikedGameItem(gameId));
      increaseLikeCount(gameId);
    }

    await delay(180);

    return HttpResponse.json({
      game_id: gameId,
      is_liked: true,
      like_count: getCurrentLikeCount(gameId),
    } satisfies RawGameLikeResponse);
  }),

  http.delete('/api/v1/games/:gameId/like', async ({ request, params }) => {
    const authorization = request.headers.get('Authorization');
    const user = getAuthorizedUser(authorization);

    if (!user) {
      return getUnauthorizedError('로그인이 필요합니다.');
    }

    const gameIdParam =
      typeof params.gameId === 'string' ? params.gameId.trim() : '';
    const gameId = Number(gameIdParam);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return getFieldValidationError(
        'game_id',
        '유효한 게임 ID를 전달해주세요.',
      );
    }

    const likedGames = getOrCreateLikedGames(user.loginId);
    const nextLikedGames = likedGames.filter((game) => game.game_id !== gameId);

    if (nextLikedGames.length !== likedGames.length) {
      mockLikedGamesByLoginId.set(user.loginId, nextLikedGames);
      decreaseLikeCount(gameId);
    }

    await delay(180);

    return HttpResponse.json({
      game_id: gameId,
      is_liked: false,
      like_count: getCurrentLikeCount(gameId),
    } satisfies RawGameLikeResponse);
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
  ...gameLikeHandlers,
  ...logoutHandlers,
];
