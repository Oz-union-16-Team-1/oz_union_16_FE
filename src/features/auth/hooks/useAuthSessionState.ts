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
  const isAuthReady = authBootstrapStatus === 'ready';
  const accessStatus: AuthAccessStatus = !isAuthReady
    ? 'loading'
    : isAuthenticated
      ? 'authenticated'
      : 'unauthenticated';

  const authSessionState: AuthSessionStateSnapshot = {
    isAuthenticated,
    isAuthReady,
    authBootstrapStatus,
    accessStatus,
  };

  return authSessionState;
}

export default useAuthSessionState;
