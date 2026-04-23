import type { ReactNode } from 'react';

import useAuthGate, {
  type UseAuthGateResult,
} from '../../features/auth/hooks/useAuthGate';

type AuthWrapperProps = {
  children: ReactNode;
  gate?: UseAuthGateResult;
  allowMockBypass?: boolean;
  loadingFallback?: ReactNode;
  unauthorizedFallback?: ReactNode;
};

function AuthWrapper({
  children,
  gate,
  allowMockBypass = false,
  loadingFallback = null,
  unauthorizedFallback = null,
}: AuthWrapperProps) {
  const fallbackGate = useAuthGate({ allowMockBypass });
  const resolvedGate = gate ?? fallbackGate;

  if (resolvedGate.needsAuthCheck) {
    return <>{loadingFallback}</>;
  }

  if (resolvedGate.shouldRedirectToLogin) {
    return <>{unauthorizedFallback}</>;
  }

  return <>{children}</>;
}

export default AuthWrapper;
