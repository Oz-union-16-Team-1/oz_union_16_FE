import { matchPath } from 'react-router';

import { ROUTES } from './routes';

type RouteValue = (typeof ROUTES)[keyof typeof ROUTES];

type MatchRouteOptions = {
  includeDescendants?: boolean;
};

export const toRoutePath = (route: RouteValue) =>
  route === ROUTES.HOME ? ROUTES.HOME : `/${route}`;

export const matchesRoutePath = (
  pathname: string,
  route: RouteValue,
  options: MatchRouteOptions = {},
) => {
  const absolutePath = toRoutePath(route);

  if (options.includeDescendants && absolutePath !== ROUTES.HOME) {
    return (
      pathname === absolutePath ||
      Boolean(
        matchPath(
          {
            path: `${absolutePath}/*`,
            end: false,
          },
          pathname,
        ),
      )
    );
  }

  return Boolean(
    matchPath(
      {
        path: absolutePath,
        end: true,
      },
      pathname,
    ),
  );
};

export const matchesAnyRoutePath = (
  pathname: string,
  routes: readonly RouteValue[],
  options: MatchRouteOptions = {},
) => routes.some((route) => matchesRoutePath(pathname, route, options));

export const isLoginPath = (pathname: string) =>
  matchesRoutePath(pathname, ROUTES.LOGIN);

export const isSignupPath = (pathname: string) =>
  matchesAnyRoutePath(pathname, [ROUTES.SIGNUP, ROUTES.LEGACY_SIGNUP]);

export const isAuthCallbackPath = (pathname: string) =>
  matchesAnyRoutePath(pathname, [
    ROUTES.AUTH_CALLBACK,
    ROUTES.LEGACY_AUTH_CALLBACK,
  ]);

export const isMyPagePath = (pathname: string) =>
  matchesRoutePath(pathname, ROUTES.MY_PAGE);

export const isHeaderGuestActionHiddenPath = (pathname: string) =>
  isLoginPath(pathname) ||
  isSignupPath(pathname) ||
  isAuthCallbackPath(pathname);

export const shouldSkipAuthBootstrapPath = isAuthCallbackPath;

export const resolvePageLabel = (pathname: string) => {
  if (isLoginPath(pathname) || isAuthCallbackPath(pathname)) {
    return '로그인';
  }

  if (isSignupPath(pathname)) {
    return '회원가입';
  }

  if (isMyPagePath(pathname)) {
    return '마이페이지';
  }

  if (matchesRoutePath(pathname, ROUTES.SURVEY, { includeDescendants: true })) {
    return '설문';
  }

  if (
    matchesRoutePath(pathname, ROUTES.MATCHING_LIST, {
      includeDescendants: true,
    })
  ) {
    return '매칭';
  }

  if (
    matchesRoutePath(pathname, ROUTES.RECOMMENDATION_LIST, {
      includeDescendants: true,
    })
  ) {
    return '추천';
  }

  return '현재';
};
