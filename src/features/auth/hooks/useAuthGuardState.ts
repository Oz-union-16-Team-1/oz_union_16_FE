import useAuthGate from './useAuthGate';

function useAuthGuardState() {
  const gate = useAuthGate();

  return {
    isAuthenticated: gate.isAuthenticated,
    isAuthReady: gate.isAuthReady,
    authBootstrapStatus: gate.authBootstrapStatus,
    canAccessAuthenticatedRoute: gate.canAccessAuthenticatedRoute,
  };
}

export default useAuthGuardState;
