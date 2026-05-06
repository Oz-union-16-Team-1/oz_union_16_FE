import type { CurrentUserSocialResponse } from '../types/auth';

const SOCIAL_LOGIN_PROVIDER_TYPES = new Set(['google', 'kakao', 'naver']);

export const normalizeSocialType = (
  socialAccount?: CurrentUserSocialResponse | null,
) => socialAccount?.social_type?.trim().toLowerCase() ?? '';

export const isSocialLoginAccount = (
  socialAccount?: CurrentUserSocialResponse | null,
) =>
  socialAccount?.is_social === true &&
  SOCIAL_LOGIN_PROVIDER_TYPES.has(normalizeSocialType(socialAccount));
