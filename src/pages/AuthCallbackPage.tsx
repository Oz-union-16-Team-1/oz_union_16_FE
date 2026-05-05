import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import MainPageLoadingFallback from '../components/common/MainPageLoadingFallback';
import { ROUTE_PATHS } from '../constants/routes';
import { extractAuthApiErrorMessage } from '../features/auth/api/auth';
import {
  clearPendingSocialAuthProvider,
  getSocialCallbackAuthorizationCode,
  getSocialCallbackErrorMessage,
  hasPendingSocialAuthProvider,
} from '../features/auth/utils/socialAuth';
import {
  clearAuthSession,
  ensureAuthSessionRestored,
} from '../features/auth/utils/sessionManager';

const DEFAULT_CALLBACK_ERROR_MESSAGE =
  '소셜 로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.';
const DEFAULT_REFRESH_ERROR_MESSAGE =
  '세션을 확인하지 못했습니다. 다시 로그인해 주세요.';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const redirectToLogin = (errorMessage: string) => {
      clearAuthSession();
      clearPendingSocialAuthProvider();

      navigate(ROUTE_PATHS.LOGIN, {
        replace: true,
        state: { errorMessage },
      });
    };

    const handleAuthCallback = async () => {
      setIsLoading(true);

      const searchParams = new URLSearchParams(location.search);
      const authorizationCode =
        getSocialCallbackAuthorizationCode(searchParams);
      const callbackErrorMessage = getSocialCallbackErrorMessage(searchParams);
      const hasPendingSocialProvider = hasPendingSocialAuthProvider();
      const shouldRestoreSession =
        Boolean(authorizationCode) ||
        hasPendingSocialProvider ||
        searchParams.size === 0;
      const shouldPreferDirectBackendRefreshInDev =
        import.meta.env.DEV &&
        (Boolean(authorizationCode) || hasPendingSocialProvider);

      if (callbackErrorMessage) {
        redirectToLogin(callbackErrorMessage);
        return;
      }

      if (!shouldRestoreSession) {
        redirectToLogin(DEFAULT_CALLBACK_ERROR_MESSAGE);
        return;
      }

      try {
        await ensureAuthSessionRestored({
          preferDirectBackendOriginInDev: shouldPreferDirectBackendRefreshInDev,
        });

        if (!isMounted) {
          return;
        }

        clearPendingSocialAuthProvider();
        navigate(ROUTE_PATHS.HOME, { replace: true });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        redirectToLogin(
          extractAuthApiErrorMessage(error) || DEFAULT_REFRESH_ERROR_MESSAGE,
        );
      }
    };

    void handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate]);

  return isLoading ? <MainPageLoadingFallback /> : null;
}

export default AuthCallbackPage;
