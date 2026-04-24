export const ROUTES = {
  HOME: '/',
  SURVEY: 'survey',
  MATCHING_LIST: 'matching-list',
  MATCHING_GENRE_DETAIL: 'matching-list/:genreSlug',
  RECOMMENDATION_LIST: 'recommendation-list',
  AUTH_CALLBACK: 'callback',
  LEGACY_AUTH_CALLBACK: 'auth/callback',
  LOGIN: 'login',
  SIGNUP: 'join',
  LEGACY_SIGNUP: 'signup',
  MY_PAGE: 'my-page',
} as const;

export const ROUTE_PATHS = {
  HOME: ROUTES.HOME,
  SURVEY: `/${ROUTES.SURVEY}`,
  MATCHING_LIST: `/${ROUTES.MATCHING_LIST}`,
  RECOMMENDATION_LIST: `/${ROUTES.RECOMMENDATION_LIST}`,
  AUTH_CALLBACK: `/${ROUTES.AUTH_CALLBACK}`,
  LEGACY_AUTH_CALLBACK: `/${ROUTES.LEGACY_AUTH_CALLBACK}`,
  LOGIN: `/${ROUTES.LOGIN}`,
  SIGNUP: `/${ROUTES.SIGNUP}`,
  LEGACY_SIGNUP: `/${ROUTES.LEGACY_SIGNUP}`,
  MY_PAGE: `/${ROUTES.MY_PAGE}`,
} as const;
