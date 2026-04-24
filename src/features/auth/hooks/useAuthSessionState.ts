import {
  selectAuthSessionState,
  useAuthStore,
} from '../../../store/useAuthStore';

function useAuthSessionState() {
  return useAuthStore(selectAuthSessionState);
}

export default useAuthSessionState;
