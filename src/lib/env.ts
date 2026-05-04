type DevApiMode = 'mock' | 'real';

const DEV_API_MODE_STORAGE_KEY = 'pgti-dev-api-mode';
const DEV_API_MODE_QUERY_PARAM = 'apiMode';

const readMswToggleValue = () => {
  const env = import.meta.env as Record<string, string | undefined>;

  return env.VITE_USE_MSW ?? env.VITE_ENABLE_MSW;
};

const isMockServiceWorkerEnabledInEnv = () =>
  readMswToggleValue()?.trim().toLowerCase() !== 'false';

const normalizedApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/$/, '');

const isDevApiMode = (value: string | null | undefined): value is DevApiMode =>
  value === 'mock' || value === 'real';

const readDevApiModeFromQuery = (): DevApiMode | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const queryValue = new URLSearchParams(window.location.search)
    .get(DEV_API_MODE_QUERY_PARAM)
    ?.trim()
    .toLowerCase();

  return isDevApiMode(queryValue) ? queryValue : null;
};

const readDevApiModeFromStorage = (): DevApiMode | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageValue = window.localStorage
    .getItem(DEV_API_MODE_STORAGE_KEY)
    ?.trim()
    .toLowerCase();

  return isDevApiMode(storageValue) ? storageValue : null;
};

const persistDevApiMode = (mode: DevApiMode) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DEV_API_MODE_STORAGE_KEY, mode);
};

const getDefaultDevApiMode = (): DevApiMode =>
  isMockServiceWorkerEnabledInEnv() ? 'mock' : 'real';

const resolveDevApiMode = (): DevApiMode => {
  if (!import.meta.env.DEV) {
    return getDefaultDevApiMode();
  }

  const queryMode = readDevApiModeFromQuery();

  if (queryMode) {
    persistDevApiMode(queryMode);
    return queryMode;
  }

  return readDevApiModeFromStorage() ?? getDefaultDevApiMode();
};

export const configuredApiBaseUrl = normalizedApiBaseUrl;
export const devApiMode = resolveDevApiMode();
export const canToggleDevApiMode = import.meta.env.DEV;
export const mockServiceWorkerEnabled =
  import.meta.env.DEV && devApiMode === 'mock';

const shouldUseRelativeApiBaseUrl = import.meta.env.DEV;

// 개발 환경에서는 항상 상대 경로(`/api/...`)를 사용해 Vite 프록시나
// MSW가 요청을 동일한 진입점에서 가로챌 수 있게 맞춘다.
export const apiBaseUrl = shouldUseRelativeApiBaseUrl
  ? ''
  : configuredApiBaseUrl;

export const isMockServiceWorkerEnabled = () => mockServiceWorkerEnabled;
export const getCurrentDevApiMode = () => devApiMode;

export const setDevApiMode = (mode: DevApiMode) => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  persistDevApiMode(mode);
};

export const toggleDevApiMode = (mode: DevApiMode) => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  persistDevApiMode(mode);

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete(DEV_API_MODE_QUERY_PARAM);
  window.history.replaceState(window.history.state, '', currentUrl.toString());
  window.location.reload();
};
