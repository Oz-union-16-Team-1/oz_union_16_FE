import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import AuthLayout from '../components/layout/AuthLayout';
import { ROUTES } from '../constants/routes';
import {
  extractAuthApiErrorMessage,
  getCurrentUserProfile,
} from '../features/auth/api/auth';
import {
  getSocialCallbackAccessToken,
  getSocialCallbackErrorMessage,
} from '../features/auth/utils/socialAuth';
import { clearAuthTokens, setAccessToken, setAuthAccount } from '../utils/auth';

const DEFAULT_CALLBACK_ERROR_MESSAGE =
  '소셜 로그인 처리에 실패했습니다. 다시 시도해 주세요.';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState(
    '소셜 로그인 정보를 확인하는 중입니다.',
  );

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const callbackErrorMessage = getSocialCallbackErrorMessage(searchParams);

      if (callbackErrorMessage) {
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: {
            errorMessage: callbackErrorMessage,
          },
        });
        return;
      }

      const accessToken = getSocialCallbackAccessToken(searchParams);

      if (!accessToken) {
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: {
            errorMessage:
              '소셜 로그인 응답에 access token이 없어 로그인 상태를 저장할 수 없습니다.',
          },
        });
        return;
      }

      try {
        setAccessToken(accessToken);
        const profile = await getCurrentUserProfile();

        if (!isMounted) {
          return;
        }

        setAuthAccount(profile);
        navigate(ROUTES.HOME, { replace: true });
      } catch (error) {
        clearAuthTokens();

        if (!isMounted) {
          return;
        }

        setStatusMessage(DEFAULT_CALLBACK_ERROR_MESSAGE);
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: {
            errorMessage:
              extractAuthApiErrorMessage(error) ||
              DEFAULT_CALLBACK_ERROR_MESSAGE,
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
      title="소셜 로그인"
      subtitle="로그인 정보를 확인하고 있습니다."
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
