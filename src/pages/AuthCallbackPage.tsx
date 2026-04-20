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
import { useAuthStore } from '../store/useAuthStore';

/**
 * [Refactor] 인증 아키텍처 업데이트 (#94)
 * - 소셜 로그인 성공 후 백엔드에서 리다이렉트된 콜백을 처리합니다.
 * - URL 파라미터에서 access_token을 추출하고, 유저 정보를 페칭합니다.
 * - Refresh Token은 이미 백엔드에 의해 HttpOnly 쿠키로 설정된 상태여야 합니다.
 */

const DEFAULT_CALLBACK_ERROR_MESSAGE =
  '소셜 로그인 처리에 실패했습니다. 다시 시도해 주세요.';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, clearAuth } = useAuthStore();
  const [statusMessage, setStatusMessage] = useState(
    '소셜 로그인 정보를 확인하는 중입니다.',
  );

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);

      // 1. 에러 파라미터 확인
      const callbackErrorMessage = getSocialCallbackErrorMessage(searchParams);
      if (callbackErrorMessage) {
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: { errorMessage: callbackErrorMessage },
        });
        return;
      }

      // 2. Access Token 추출
      const accessToken = getSocialCallbackAccessToken(searchParams);
      if (!accessToken) {
        navigate(`/${ROUTES.LOGIN}`, {
          replace: true,
          state: {
            errorMessage:
              '인증 정보가 유효하지 않습니다. 다시 로그인해 주세요.',
          },
        });
        return;
      }

      try {
        // 3. 임시로 토큰 설정 후 유저 프로필 조회
        // (getCurrentUserProfile 내부의 axiosInstance가 이 토큰을 사용함)
        useAuthStore.getState().setAccessToken(accessToken);

        const profile = await getCurrentUserProfile();

        if (!isMounted) return;

        // 4. 최종 인증 상태 저장
        setAuth(accessToken, profile);

        // 5. 홈으로 이동
        navigate(ROUTES.HOME, { replace: true });
      } catch (error) {
        if (!isMounted) return;

        clearAuth();
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
