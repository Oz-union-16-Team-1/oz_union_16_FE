import { useNavigate } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import { clearAuthTokens } from '../../../utils/auth';
import { useLogoutMutation } from '../api/useAuthApi';

function useLogoutAction() {
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();

  const logout = async (
    noticeMessage = '로그아웃 되었습니다. 다시 로그인해 주세요.',
  ) => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Even if the API call fails, clear the local session so the user can recover.
    }

    clearAuthTokens();
    navigate(`/${ROUTES.LOGIN}`, {
      replace: true,
      state: {
        noticeMessage,
      },
    });
  };

  return {
    logout,
    isPending: logoutMutation.isPending,
  };
}

export default useLogoutAction;
