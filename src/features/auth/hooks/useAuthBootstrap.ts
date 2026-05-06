import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { shouldSkipAuthBootstrapPath } from '../../../constants/routeResolver';
import {
  clearLegacyAuthStorage,
  syncAccessTokenFromStorage,
  useAuthStore,
} from '../../../store/useAuthStore';
import {
  clearAuthSession,
  hydrateAuthSessionFromAccessToken,
  refreshStoredAccessToken,
  setAuthBootstrapLoading,
  setAuthBootstrapReady,
} from '../utils/sessionManager';
import { isAccessTokenExpiringSoon } from '../utils/accessToken';

function useAuthBootstrap() {
  const location = useLocation();
  const authBootstrapStatus = useAuthStore(
    (state) => state.authBootstrapStatus,
  );

  useEffect(() => {
    clearLegacyAuthStorage();
  }, []);

  useEffect(() => {
    if (authBootstrapStatus !== 'idle') {
      return;
    }

    if (shouldSkipAuthBootstrapPath(location.pathname)) {
      setAuthBootstrapReady();
      return;
    }

    const storedAccessToken = syncAccessTokenFromStorage();

    if (!storedAccessToken) {
      setAuthBootstrapReady();
      return;
    }

    setAuthBootstrapLoading();

    const restorePromise = isAccessTokenExpiringSoon(storedAccessToken)
      ? refreshStoredAccessToken().then((refreshedAccessToken) =>
          hydrateAuthSessionFromAccessToken(refreshedAccessToken),
        )
      : hydrateAuthSessionFromAccessToken(storedAccessToken);

    void restorePromise
      .catch(() => {
        clearAuthSession({ setReady: false });
      })
      .finally(() => {
        if (useAuthStore.getState().authBootstrapStatus === 'loading') {
          setAuthBootstrapReady();
        }
      });
  }, [authBootstrapStatus, location.pathname]);

  return {
    authBootstrapStatus,
    isAuthReady: authBootstrapStatus === 'ready',
  };
}

export default useAuthBootstrap;
