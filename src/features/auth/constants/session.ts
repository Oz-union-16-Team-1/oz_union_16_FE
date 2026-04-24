export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

export const AUTH_SESSION_EXPIRED_NOTICE_MESSAGE =
  '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.';
export const AUTH_SESSION_RESTORE_FAILED_NOTICE_MESSAGE =
  '로그인 상태를 유지할 수 없습니다. 다시 로그인해 주세요.';

export type AuthSessionExpiredDetail = {
  noticeMessage?: string;
  source?: 'refresh' | 'manual';
};

export const createAuthSessionExpiredEvent = (
  detail: AuthSessionExpiredDetail = {},
) =>
  new CustomEvent<AuthSessionExpiredDetail>(AUTH_SESSION_EXPIRED_EVENT, {
    detail,
  });
