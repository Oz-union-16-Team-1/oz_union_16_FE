import { matchPath } from 'react-router';

import { ROUTES } from '@/constants/routes';
import type { SupportChatRouteContext } from '../types/supportChat';

const LOGIN_PATH = `/${ROUTES.LOGIN}`;
const SIGNUP_PATHS = new Set([`/${ROUTES.SIGNUP}`, `/${ROUTES.LEGACY_SIGNUP}`]);
const AUTH_CALLBACK_PATHS = new Set([
  `/${ROUTES.AUTH_CALLBACK}`,
  `/${ROUTES.LEGACY_AUTH_CALLBACK}`,
]);
const MY_PAGE_PATH = `/${ROUTES.MY_PAGE}`;
const SURVEY_PATH = `/${ROUTES.SURVEY}`;
const SURVEY_PATH_PATTERN = `/${ROUTES.SURVEY}/*`;
const MATCHING_PATH = `/${ROUTES.MATCHING_LIST}`;
const MATCHING_PATH_PATTERN = `/${ROUTES.MATCHING_LIST}/*`;
const RECOMMENDATION_PATH = `/${ROUTES.RECOMMENDATION_LIST}`;
const RECOMMENDATION_PATH_PATTERN = `/${ROUTES.RECOMMENDATION_LIST}/*`;

const getSupportChatPageLabel = (pathname: string) => {
  if (pathname === LOGIN_PATH) {
    return '로그인';
  }

  if (SIGNUP_PATHS.has(pathname)) {
    return '회원가입';
  }

  if (AUTH_CALLBACK_PATHS.has(pathname)) {
    return '로그인';
  }

  if (pathname === MY_PAGE_PATH) {
    return '마이페이지';
  }

  if (pathname === SURVEY_PATH || matchPath(SURVEY_PATH_PATTERN, pathname)) {
    return '설문';
  }

  if (
    pathname === MATCHING_PATH ||
    matchPath(MATCHING_PATH_PATTERN, pathname)
  ) {
    return '매칭';
  }

  if (
    pathname === RECOMMENDATION_PATH ||
    matchPath(RECOMMENDATION_PATH_PATTERN, pathname)
  ) {
    return '추천';
  }

  return '현재';
};

export const getSupportChatRouteContext = (
  pathname: string,
): SupportChatRouteContext => ({
  pathname,
  pageLabel: getSupportChatPageLabel(pathname),
});
