const readMswToggleValue = () => {
  const env = import.meta.env as Record<string, string | undefined>;

  return env.VITE_USE_MSW ?? env.VITE_ENABLE_MSW;
};

const isMockServiceWorkerEnabledInEnv = () =>
  readMswToggleValue()?.trim().toLowerCase() !== 'false';

export const mockServiceWorkerEnabled =
  import.meta.env.DEV && isMockServiceWorkerEnabledInEnv();

const normalizedApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/$/, '');

export const configuredApiBaseUrl = normalizedApiBaseUrl;

// MSW 모드에서는 절대 API 호스트를 비워, 상대 경로 요청이 핸들러에 안정적으로 매칭되게 한다.
export const apiBaseUrl = mockServiceWorkerEnabled ? '' : configuredApiBaseUrl;

export const isMockServiceWorkerEnabled = () => mockServiceWorkerEnabled;
