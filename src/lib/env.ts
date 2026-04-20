export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const mockServiceWorkerEnabled =
  import.meta.env.DEV && import.meta.env.VITE_USE_MSW !== 'false';

export const isMockServiceWorkerEnabled = () => mockServiceWorkerEnabled;
