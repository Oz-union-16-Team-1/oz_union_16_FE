import { configuredApiBaseUrl, mockServiceWorkerEnabled } from '@/lib/env';
import { useAuthStore } from '@/store/useAuthStore';

const CANONICAL_FRONTEND_ORIGIN = 'https://oz-union-16-fe.vercel.app';
const CANONICAL_BACKEND_ORIGIN = 'https://oz-pgti.duckdns.org';

const isAuthDiagnosticsEnabled = import.meta.env.DEV;

const shouldSkipAuthDiagnostics = () =>
  !isAuthDiagnosticsEnabled || mockServiceWorkerEnabled;

const getFrontendOrigin = () => {
  if (typeof window === 'undefined') {
    return CANONICAL_FRONTEND_ORIGIN;
  }

  return window.location.origin;
};

const resolveOrigin = (target: string) => {
  if (!target) {
    return '';
  }

  try {
    return new URL(target, getFrontendOrigin()).origin;
  } catch {
    return '';
  }
};

const isHttpsOrigin = (origin: string) => origin.startsWith('https://');
const getHostname = (target: string) => {
  if (!target) {
    return '';
  }

  try {
    return new URL(target, getFrontendOrigin()).hostname;
  } catch {
    return '';
  }
};

const isSecureBrowserContext = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.isSecureContext;
};

type AuthRequestDiagnostics = {
  label: 'login' | 'logout' | 'refresh';
  requestUrl: string;
  withCredentials: boolean;
};

export const logCredentialedAuthRequestDiagnostics = ({
  label,
  requestUrl,
  withCredentials,
}: AuthRequestDiagnostics) => {
  if (shouldSkipAuthDiagnostics()) {
    return;
  }

  const frontendOrigin = getFrontendOrigin();
  const configuredBackendOrigin = resolveOrigin(configuredApiBaseUrl);
  const requestOrigin = resolveOrigin(requestUrl);
  const frontendHostname = getHostname(frontendOrigin);
  const configuredBackendHostname = getHostname(configuredBackendOrigin);
  const requestHostname = getHostname(requestOrigin);
  const isCrossOrigin = Boolean(
    requestOrigin && frontendOrigin && requestOrigin !== frontendOrigin,
  );
  const hostnamesDiffer = Boolean(
    frontendHostname && requestHostname && frontendHostname !== requestHostname,
  );
  const secureContext = isSecureBrowserContext();

  console.info(`[auth-diagnostics] ${label} request`, {
    frontendOrigin,
    frontendHostname,
    configuredBackendOrigin,
    configuredBackendHostname,
    canonicalFrontendOrigin: CANONICAL_FRONTEND_ORIGIN,
    canonicalBackendOrigin: CANONICAL_BACKEND_ORIGIN,
    requestOrigin,
    requestHostname,
    isCrossOrigin,
    hostnamesDiffer,
    withCredentials,
    frontendUsesHttps: isHttpsOrigin(frontendOrigin),
    requestTargetUsesHttps: isHttpsOrigin(requestOrigin),
    isSecureContext: secureContext,
  });

  if (
    configuredBackendOrigin &&
    configuredBackendOrigin !== CANONICAL_BACKEND_ORIGIN
  ) {
    console.warn(
      `[auth-diagnostics] VITE_API_BASE_URL origin mismatch: ${configuredBackendOrigin} (expected ${CANONICAL_BACKEND_ORIGIN})`,
    );
  }

  if (requestOrigin && requestOrigin !== CANONICAL_BACKEND_ORIGIN) {
    console.warn(
      `[auth-diagnostics] request target origin mismatch: ${requestOrigin} (expected ${CANONICAL_BACKEND_ORIGIN})`,
    );
  }

  if (!isHttpsOrigin(frontendOrigin)) {
    console.warn(
      `[auth-diagnostics] frontend is not using https: ${frontendOrigin}`,
    );
  }

  if (requestOrigin && !isHttpsOrigin(requestOrigin)) {
    console.warn(
      `[auth-diagnostics] request target is not using https: ${requestOrigin}`,
    );
  }

  if (isCrossOrigin && !withCredentials) {
    console.warn(
      '[auth-diagnostics] cross-origin auth request is missing withCredentials=true',
    );
  }

  if (hostnamesDiffer) {
    console.warn(
      `[auth-diagnostics] frontend hostname (${frontendHostname}) and API hostname (${requestHostname}) differ. Browser third-party cookie blocking may prevent refresh_token storage/transmission.`,
    );
  }

  if (!secureContext) {
    console.warn(
      '[auth-diagnostics] window.isSecureContext is false. Secure cookies may be rejected by the browser in this environment.',
    );
  }
};

export const logRefreshRequestStarted = () => {
  if (shouldSkipAuthDiagnostics()) {
    return;
  }

  console.info('[auth-diagnostics] refresh request started');
};

export const logRefreshRequestSucceeded = (accessToken: string) => {
  if (shouldSkipAuthDiagnostics()) {
    return;
  }

  console.info('[auth-diagnostics] refresh request succeeded', {
    hasAccessToken: Boolean(accessToken.trim()),
    accessTokenLength: accessToken.trim().length,
  });
};

export const logRefreshRequestFailed = (error: unknown) => {
  if (shouldSkipAuthDiagnostics()) {
    return;
  }

  const normalizedError =
    error instanceof Error
      ? {
          message: error.message,
          name: error.name,
        }
      : {
          message: 'unknown error',
          name: 'UnknownError',
        };

  console.warn('[auth-diagnostics] refresh request failed', normalizedError);
};

export const logRefreshStoreSync = (accessToken: string) => {
  if (shouldSkipAuthDiagnostics()) {
    return;
  }

  const currentStoreToken = useAuthStore.getState().accessToken?.trim() ?? '';
  const normalizedAccessToken = accessToken.trim();

  console.info('[auth-diagnostics] refresh store sync', {
    storeHasAccessToken: Boolean(currentStoreToken),
    storeTokenMatchesResponse:
      Boolean(currentStoreToken) && currentStoreToken === normalizedAccessToken,
  });

  if (!currentStoreToken) {
    console.warn(
      '[auth-diagnostics] refresh succeeded but access token was not synchronized to the auth store',
    );
  }
};
