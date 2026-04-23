import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import {
  clearLegacyAuthStorage,
  useAuthStore,
} from '../../../store/useAuthStore';
import { getCurrentUserProfile, refreshAccessToken } from '../api/auth';

const AUTH_BOOTSTRAP_SKIP_PATHS = new Set([
  `/${ROUTES.AUTH_CALLBACK}`,
  `/${ROUTES.LEGACY_AUTH_CALLBACK}`,
]);

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

    if (AUTH_BOOTSTRAP_SKIP_PATHS.has(location.pathname)) {
      store.setAuthBootstrapStatus('ready');
      return;
    }

    let isMounted = true;
    store.setAuthBootstrapStatus('loading');

    const bootstrapAuth = async () => {
      try {
        const { access_token: accessToken } = await refreshAccessToken();

        if (!isMounted) {
          return;
        }

        useAuthStore.getState().setAccessToken(accessToken);
        const profile = await getCurrentUserProfile();

        if (!isMounted) {
          return;
        }

        useAuthStore.getState().setAccount(profile);
      } catch {
        if (!isMounted) {
          return;
        }

        useAuthStore.getState().clearAuth();
      } finally {
        if (isMounted) {
          useAuthStore.getState().setAuthBootstrapStatus('ready');
        }
      }
    };

    void bootstrapAuth();

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
