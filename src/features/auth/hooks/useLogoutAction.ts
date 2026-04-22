import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import { clearAuthTokens } from '../../../utils/auth';
import { authKeys } from '../api/queryKeys';
import { useLogoutMutation } from '../api/useAuthApi';

function useLogoutAction() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Invalid or expired tokens should not keep the UI in a logged-in state.
    }

    clearAuthTokens();
    await queryClient.cancelQueries({ queryKey: authKeys.all });
    queryClient.removeQueries({ queryKey: authKeys.all });
    navigate(ROUTES.HOME, { replace: true });
  };

  return {
    logout,
    isPending: logoutMutation.isPending,
  };
}

export default useLogoutAction;
