import { Navigate, useLocation } from 'react-router';

type LegacyRouteRedirectProps = {
  to: string;
};

function LegacyRouteRedirect({ to }: LegacyRouteRedirectProps) {
  const location = useLocation();

  return <Navigate to={`${to}${location.search}`} replace />;
}

export default LegacyRouteRedirect;
