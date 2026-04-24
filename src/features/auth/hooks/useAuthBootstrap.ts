import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import { isMockServiceWorkerEnabled } from '../../../lib/env';
import {
  clearLegacyAuthStorage,
  useAuthStore,
} from '../../../store/useAuthStore';
import {
  getCurrentUserProfile,
  hasMockRefreshToken,
  refreshAccessToken,
} from '../api/auth';

const AUTH_BOOTSTRAP_SKIP_PATHS = new Set([
  `/${ROUTES.AUTH_CALLBACK}`,
  `/${ROUTES.LEGACY_AUTH_CALLBACK}`,
]);

let authBootstrapPromise: Promise<void> | null = null;

const runAuthBootstrap = async () => {
  const { access_token: accessToken } = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(accessToken);
  const profile = await getCurrentUserProfile();
  useAuthStore.getState().setAccount(profile);
};

const ensureAuthBootstrap = () => {
  if (!authBootstrapPromise) {
    authBootstrapPromise = runAuthBootstrap()
      .catch(() => {
        useAuthStore.getState().clearAuth();
      })
      .finally(() => {
        authBootstrapPromise = null;
      });
  }

  return authBootstrapPromise;
};

function useAuthBootstrap() {
  const location = useLocation();
  const authBootstrapStatus = useAuthStore(
    (state) => state.authBootstrapStatus,
  );
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    clearLegacyAuthStorage();
  }, []);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;

    const store = useAuthStore.getState();

    if (store.accessToken) {
      store.setAuthBootstrapStatus('ready');
      return;
    }

    if (AUTH_BOOTSTRAP_SKIP_PATHS.has(location.pathname)) {
      store.setAuthBootstrapStatus('ready');
      return;
    }

    if (isMockServiceWorkerEnabled() && !hasMockRefreshToken()) {
      store.setAuthBootstrapStatus('ready');
      return;
    }

    let isMounted = true;
    store.setAuthBootstrapStatus('loading');

    void ensureAuthBootstrap().finally(() => {
      if (isMounted) {
        useAuthStore.getState().setAuthBootstrapStatus('ready');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return {
    authBootstrapStatus,
    isAuthReady: authBootstrapStatus === 'ready',
  };
}

export default useAuthBootstrap;
