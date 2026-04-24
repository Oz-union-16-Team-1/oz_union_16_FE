import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { shouldSkipAuthBootstrapPath } from '../../../constants/routeResolver';
import { isMockServiceWorkerEnabled } from '../../../lib/env';
import {
  clearLegacyAuthStorage,
  useAuthStore,
} from '../../../store/useAuthStore';
import { hasMockRefreshToken } from '../api/auth';
import {
  restoreAuthSession,
  setAuthBootstrapLoading,
  setAuthBootstrapReady,
} from '../utils/sessionManager';

let authBootstrapPromise: Promise<void> | null = null;

const ensureAuthBootstrap = (): Promise<void> => {
  if (!authBootstrapPromise) {
    authBootstrapPromise = restoreAuthSession()
      .then(() => undefined)
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
      setAuthBootstrapReady();
      return;
    }

    if (shouldSkipAuthBootstrapPath(location.pathname)) {
      setAuthBootstrapReady();
      return;
    }

    if (isMockServiceWorkerEnabled() && !hasMockRefreshToken()) {
      setAuthBootstrapReady();
      return;
    }

    let isMounted = true;
    setAuthBootstrapLoading();

    void ensureAuthBootstrap().finally(() => {
      if (isMounted) {
        setAuthBootstrapReady();
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
