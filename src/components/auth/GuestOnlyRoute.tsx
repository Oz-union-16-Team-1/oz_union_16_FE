import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { ROUTE_PATHS } from '../../constants/routes';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import MainPageLoadingFallback from '../common/MainPageLoadingFallback';

type GuestOnlyRouteProps = {
  children: ReactNode;
  loadingFallback?: ReactNode;
};

function GuestOnlyRoute({
  children,
  loadingFallback = <MainPageLoadingFallback />,
}: GuestOnlyRouteProps) {
  const authGate = useAuthGate();

  if (authGate.needsAuthCheck) {
    return <>{loadingFallback}</>;
  }

  if (authGate.canAccessAuthenticatedRoute) {
    return <Navigate to={ROUTE_PATHS.HOME} replace />;
  }

  return <>{children}</>;
}

export default GuestOnlyRoute;
