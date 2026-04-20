import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import AuthLayout from '../components/layout/AuthLayout';
import { ROUTES } from '../constants/routes';
import {
  completeSocialLogin,
  extractAuthApiErrorMessage,
  extractSuspendedAccountInfo,
  getCurrentUserProfile,
} from '../features/auth/api/auth';
import {
  clearPendingSocialAuthProvider,
  getSocialCallbackCode,
  getSocialCallbackErrorMessage,
  getSocialCallbackProvider,
  getSocialCallbackState,
} from '../features/auth/utils/socialAuth';
import { useAuthStore } from '../store/useAuthStore';

const DEFAULT_CALLBACK_ERROR_MESSAGE =
  '소셜 로그인 처리에 실패했습니다. 다시 시도해 주세요.';
const INVALID_CALLBACK_ERROR_MESSAGE =
  '인증 정보가 유효하지 않습니다. 다시 로그인해 주세요.';

const formatSuspendedAt = (suspendedAt: string | null) => {
  if (!suspendedAt) {
    return '정지 일시 정보가 없습니다.';
  }

  const suspendedDate = new Date(suspendedAt);

  if (Number.isNaN(suspendedDate.getTime())) {
    return suspendedAt;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(suspendedDate);
};

function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, clearAuth } = useAuthStore();
  const handledSearchRef = useRef<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    '소셜 로그인 정보를 확인하고 있습니다.',
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
        clearPendingSocialAuthProvider();
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: { errorMessage: callbackErrorMessage },
        });
        return;
      }

      const provider = getSocialCallbackProvider(searchParams);
      const code = getSocialCallbackCode(searchParams);
      const socialState =
        provider === 'naver'
          ? (getSocialCallbackState(searchParams) ?? undefined)
          : undefined;

      if (!provider || !code || (provider === 'naver' && !socialState)) {
        clearPendingSocialAuthProvider();
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: {
            errorMessage: INVALID_CALLBACK_ERROR_MESSAGE,
          },
        });
        return;
      }

      try {
        const loginResponse = await completeSocialLogin(provider, {
          code,
          ...(provider === 'naver' ? { state: socialState } : {}),
        });
        useAuthStore.getState().setAccessToken(loginResponse.access_token);

        const profile = await getCurrentUserProfile();

        if (!isMounted) {
          return;
        }

        setAuth(loginResponse.access_token, profile);
        clearPendingSocialAuthProvider();

        navigate(ROUTES.HOME, { replace: true });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        clearAuth();
        clearPendingSocialAuthProvider();

        const suspendedAccountInfo = extractSuspendedAccountInfo(error);
        if (suspendedAccountInfo) {
          const suspendedAtLabel = formatSuspendedAt(
            suspendedAccountInfo.suspendedAt,
          );
          const alertMessage = `정지된 계정입니다.\n정지 일시: ${suspendedAtLabel}`;

          window.alert(alertMessage);

          navigate(`/${ROUTES.LOGIN}`, {
            replace: true,
            state: {
              errorMessage: `정지된 계정입니다. 정지 일시: ${suspendedAtLabel}`,
            },
          });
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
  }, [location.search, navigate, setAuth, clearAuth]);

  return (
    <AuthLayout
      title="로그인 확인"
      subtitle="소셜 로그인 정보를 확인하고 있습니다."
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
