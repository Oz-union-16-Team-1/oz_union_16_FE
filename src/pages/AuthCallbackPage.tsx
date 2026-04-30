import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import AuthLayout from '../components/layout/AuthLayout';
import { ROUTES } from '../constants/routes';
import { extractAuthApiErrorMessage } from '../features/auth/api/auth';
import {
  clearPendingSocialAuthProvider,
  getSocialCallbackErrorMessage,
} from '../features/auth/utils/socialAuth';
import {
  clearAuthSession,
  restoreAuthSession,
} from '../features/auth/utils/sessionManager';

const DEFAULT_REFRESH_ERROR_MESSAGE =
  '세션을 확인하지 못했습니다. 다시 로그인해 주세요.';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const restorePromiseRef = useRef<Promise<void> | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    '소셜 로그인 세션을 확인하는 중입니다.',
  );

  useEffect(() => {
    let isMounted = true;

    const ensureRestorePromise = () => {
      if (!restorePromiseRef.current) {
        restorePromiseRef.current = restoreAuthSession()
          .then(() => undefined)
          .finally(() => {
            restorePromiseRef.current = null;
          });
      }

      return restorePromiseRef.current;
    };

    const handleAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const callbackErrorMessage = getSocialCallbackErrorMessage(searchParams);

      if (callbackErrorMessage) {
        clearAuthSession();
        clearPendingSocialAuthProvider();
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: { errorMessage: callbackErrorMessage },
        });
        return;
      }

      try {
        await ensureRestorePromise();

        if (!isMounted) {
          return;
        }

        clearPendingSocialAuthProvider();

        if (typeof window !== 'undefined') {
          window.location.replace(ROUTES.HOME);
          return;
        }

        navigate(ROUTES.HOME, { replace: true });
      } catch (error) {
        if (!isMounted) {
          return;
        }

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
  }, [location.search, navigate]);

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
