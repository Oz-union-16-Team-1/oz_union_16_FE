import { useAuthStore } from '../../../store/useAuthStore';

function useAuthGuardState() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authBootstrapStatus = useAuthStore(
    (state) => state.authBootstrapStatus,
  );
  const isAuthReady = authBootstrapStatus === 'ready';

  return {
    isAuthenticated,
    isAuthReady,
    authBootstrapStatus,
    canAccessAuthenticatedRoute: isAuthReady && isAuthenticated,
  };
}

export default useAuthGuardState;
