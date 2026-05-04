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
    const currentAuthBootstrapStatus =
      useAuthStore.getState().authBootstrapStatus;

    if (currentAuthBootstrapStatus !== 'idle') {
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

    if (!isAccessTokenExpiringSoon(storedAccessToken)) {
      setAuthBootstrapReady();
      return;
    }

    setAuthBootstrapLoading();

    void refreshStoredAccessToken()
      .catch(() => {
        clearAuthSession({ setReady: false });
      })
      .finally(() => {
        if (useAuthStore.getState().authBootstrapStatus === 'loading') {
          setAuthBootstrapReady();
        }
      });
  }, [location.pathname]);

  return {
    authBootstrapStatus,
    isAuthReady: authBootstrapStatus === 'ready',
  };
}

export default useAuthBootstrap;
