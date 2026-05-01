import type {
  AuthAccessStatus,
  AuthSessionStateSnapshot,
} from '../../../store/useAuthStore';
import { useAuthStore } from '../../../store/useAuthStore';

function useAuthSessionState() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authBootstrapStatus = useAuthStore(
    (state) => state.authBootstrapStatus,
  );
  const isAuthLoading = authBootstrapStatus === 'loading';
  const isAuthReady = authBootstrapStatus === 'ready';
  const accessStatus: AuthAccessStatus = !isAuthReady
    ? 'loading'
    : isAuthenticated
      ? 'authenticated'
      : 'unauthenticated';

  const authSessionState: AuthSessionStateSnapshot = {
    isAuthenticated,
    isAuthLoading,
    isAuthReady,
    authBootstrapStatus,
    accessStatus,
  };

  return authSessionState;
}

export default useAuthSessionState;
