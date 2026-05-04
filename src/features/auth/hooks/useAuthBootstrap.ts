import { useEffect } from 'react';
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
  ensureAuthSessionRestored,
  setAuthBootstrapLoading,
  setAuthBootstrapReady,
} from '../utils/sessionManager';
const DEFAULT_SOCIAL_AUTH_ERROR_MESSAGE =
  '세션을 확인하지 못했습니다. 다시 로그인해 주세요.';

function useAuthBootstrap() {
  const location = useLocation();
  const navigate = useNavigate();
  const authBootstrapStatus = useAuthStore(
    (state) => state.authBootstrapStatus,
  );

  useEffect(() => {
    clearLegacyAuthStorage();
  }, []);

  useEffect(() => {
    const currentAuthBootstrapStatus =
      useAuthStore.getState().authBootstrapStatus;

    if (currentAuthBootstrapStatus !== 'idle') {
      return;
    }

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

    setAuthBootstrapLoading();

    void ensureAuthSessionRestored()
      .catch((error) => {
        if (!hasPendingSocialProvider) {
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
        // React StrictMode in development replays effects once, so this
        // completion path must not depend on component-local mount flags.
        if (hasPendingSocialProvider) {
          clearPendingSocialAuthProvider();
        }

        if (useAuthStore.getState().authBootstrapStatus === 'loading') {
          setAuthBootstrapReady();
        }
      });
  }, [location.pathname, navigate]);

  return {
    authBootstrapStatus,
    isAuthReady: authBootstrapStatus === 'ready',
  };
}

export default useAuthBootstrap;
