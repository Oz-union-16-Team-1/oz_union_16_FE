import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import { shouldSkipAuthBootstrapPath } from '../../../constants/routeResolver';
import { isMockServiceWorkerEnabled } from '../../../lib/env';
import {
  clearLegacyAuthStorage,
  useAuthStore,
} from '../../../store/useAuthStore';
import { hasMockRefreshToken } from '../api/auth.session.helper';
import { extractAuthApiErrorMessage } from '../api/auth';
import {
  clearPendingSocialAuthProvider,
  hasPendingSocialAuthProvider,
} from '../utils/socialAuth';
import {
  restoreAuthSession,
  setAuthBootstrapLoading,
  setAuthBootstrapReady,
} from '../utils/sessionManager';

let authBootstrapPromise: Promise<void> | null = null;
const DEFAULT_SOCIAL_AUTH_ERROR_MESSAGE =
  '세션을 확인하지 못했습니다. 다시 로그인해 주세요.';

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
  const navigate = useNavigate();
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

    const hasPendingSocialProvider = hasPendingSocialAuthProvider();

    if (
      isMockServiceWorkerEnabled() &&
      !hasMockRefreshToken() &&
      !hasPendingSocialProvider
    ) {
      setAuthBootstrapReady();
      return;
    }

    let isMounted = true;
    setAuthBootstrapLoading();

    void ensureAuthBootstrap()
      .catch((error) => {
        if (!hasPendingSocialProvider || !isMounted) {
          return;
        }

        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: {
            errorMessage:
              extractAuthApiErrorMessage(error) ||
              DEFAULT_SOCIAL_AUTH_ERROR_MESSAGE,
          },
        });
      })
      .finally(() => {
        if (hasPendingSocialProvider) {
          clearPendingSocialAuthProvider();
        }

        if (isMounted) {
          setAuthBootstrapReady();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

  return {
    authBootstrapStatus,
    isAuthReady: authBootstrapStatus === 'ready',
  };
}

export default useAuthBootstrap;
