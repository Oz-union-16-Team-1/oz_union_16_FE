import type { AxiosError } from 'axios';

const SENSITIVE_KEY_PATTERN =
  /(token|password|authorization|cookie|secret|credential)/i;

const toLoggablePath = (requestUrl?: string) => {
  if (!requestUrl) {
    return 'N/A';
  }

  try {
    const normalizedUrl = new URL(
      requestUrl,
      typeof window === 'undefined'
        ? 'http://localhost'
        : window.location.origin,
    );

    return normalizedUrl.pathname;
  } catch {
    return requestUrl.split('?')[0] || requestUrl;
  }
};

const maskSensitiveValue = (value: unknown, depth = 0): unknown => {
  if (depth > 4) {
    return '[masked-depth]';
  }

  if (Array.isArray(value)) {
    return value.map((entry) => maskSensitiveValue(entry, depth + 1));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([key, entryValue]) => [
          key,
          SENSITIVE_KEY_PATTERN.test(key)
            ? '[masked]'
            : maskSensitiveValue(entryValue, depth + 1),
        ],
      ),
    );
  }

  return value;
};

export const logAxiosError = (error: AxiosError, source = 'api') => {
  const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
  const path = toLoggablePath(error.config?.url);
  const statusCode = error.response?.status ?? 'NETWORK_ERROR';

  if (import.meta.env.DEV) {
    console.error(`[${source}] API error`, {
      method,
      path,
      statusCode,
      code: error.code ?? null,
      message: error.message,
      response: maskSensitiveValue(error.response?.data),
      request: maskSensitiveValue(error.config?.data),
    });

    return;
  }

  console.error(`[${source}] API error`, {
    method,
    path,
    statusCode,
    code: error.code ?? null,
  });
};
