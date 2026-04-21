import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import AuthLayout from '../components/layout/AuthLayout';
import { ROUTES } from '../constants/routes';
import {
  extractAuthApiErrorMessage,
  getCurrentUserProfile,
  refreshAccessToken,
} from '../features/auth/api/auth';
import {
  clearPendingSocialAuthProvider,
  getSocialCallbackErrorMessage,
} from '../features/auth/utils/socialAuth';
import { useAuthStore } from '../store/useAuthStore';

const DEFAULT_REFRESH_ERROR_MESSAGE =
  '세션을 확인하지 못했습니다. 다시 로그인해 주세요.';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, clearAuth } = useAuthStore();
  const handledSearchRef = useRef<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    '소셜 로그인 세션을 확인하는 중입니다.',
  );

  useEffect(() => {
    if (handledSearchRef.current === location.search) {
      return;
    }

    handledSearchRef.current = location.search;

    let isMounted = true;

    const handleAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const callbackErrorMessage = getSocialCallbackErrorMessage(searchParams);

      if (callbackErrorMessage) {
        clearAuth();
        clearPendingSocialAuthProvider();
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: { errorMessage: callbackErrorMessage },
        });
        return;
      }

      try {
        const { access_token: accessToken } = await refreshAccessToken();
        useAuthStore.getState().setAccessToken(accessToken);

        const profile = await getCurrentUserProfile();

        if (!isMounted) {
          return;
        }

        setAuth(accessToken, profile);
        clearPendingSocialAuthProvider();
        navigate(ROUTES.HOME, { replace: true });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        clearAuth();
        clearPendingSocialAuthProvider();
        setStatusMessage(DEFAULT_REFRESH_ERROR_MESSAGE);

        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: {
            errorMessage:
              extractAuthApiErrorMessage(error) ||
              DEFAULT_REFRESH_ERROR_MESSAGE,
          },
        });
      }
    };

    void handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate, setAuth, clearAuth]);

  return (
    <AuthLayout
      title="로그인 확인"
      subtitle="소셜 로그인 세션을 확인하고 있습니다."
      withPanel
      panelClassName="max-w-[500px]"
    >
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm/6 text-white/75">
        {statusMessage}
      </div>
    </AuthLayout>
  );
}

export default AuthCallbackPage;
