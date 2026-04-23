import { isMockServiceWorkerEnabled } from '../../../lib/env';
import { useAuthStore } from '../../../store/useAuthStore';

type UseAuthGateOptions = {
  allowMockBypass?: boolean;
};

export type UseAuthGateResult = {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  authBootstrapStatus: 'idle' | 'loading' | 'ready';
  isMockMode: boolean;
  canBypassAuth: boolean;
  canAccessAuthenticatedRoute: boolean;
  needsAuthCheck: boolean;
  shouldRedirectToLogin: boolean;
  accessStatus: 'loading' | 'authorized' | 'unauthorized';
};

function useAuthGate(options: UseAuthGateOptions = {}): UseAuthGateResult {
  const { allowMockBypass = false } = options;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authBootstrapStatus = useAuthStore(
    (state) => state.authBootstrapStatus,
  );
  const isAuthReady = authBootstrapStatus === 'ready';
  const isMockMode = isMockServiceWorkerEnabled();
  const canBypassAuth = allowMockBypass && isMockMode;
  const canAccessAuthenticatedRoute =
    canBypassAuth || (isAuthReady && isAuthenticated);
  const needsAuthCheck = !canBypassAuth && !isAuthReady;
  const shouldRedirectToLogin = !needsAuthCheck && !canAccessAuthenticatedRoute;
  const accessStatus = needsAuthCheck
    ? 'loading'
    : canAccessAuthenticatedRoute
      ? 'authorized'
      : 'unauthorized';

  return {
    isAuthenticated,
    isAuthReady,
    authBootstrapStatus,
    isMockMode,
    canBypassAuth,
    canAccessAuthenticatedRoute,
    needsAuthCheck,
    shouldRedirectToLogin,
    accessStatus,
  };
}

export default useAuthGate;
