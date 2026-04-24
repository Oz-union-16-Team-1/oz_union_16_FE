import { isMockServiceWorkerEnabled } from '../../../lib/env';
import useAuthSessionState from './useAuthSessionState';

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
  const { isAuthenticated, authBootstrapStatus, isAuthReady, accessStatus } =
    useAuthSessionState();
  const isMockMode = isMockServiceWorkerEnabled();
  const canBypassAuth = allowMockBypass && isMockMode;
  const canAccessAuthenticatedRoute =
    canBypassAuth || accessStatus === 'authenticated';
  const needsAuthCheck = !canBypassAuth && accessStatus === 'loading';
  const shouldRedirectToLogin =
    !canBypassAuth && accessStatus === 'unauthenticated';
  const resolvedAccessStatus = needsAuthCheck
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
    accessStatus: resolvedAccessStatus,
  };
}

export default useAuthGate;
