import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { isLoginPath } from './constants/routeResolver';
import { ROUTE_PATHS } from './constants/routes';
import {
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_SESSION_EXPIRED_NOTICE_MESSAGE,
  type AuthSessionExpiredDetail,
} from './features/auth/constants/session';
import useAuthBootstrap from './features/auth/hooks/useAuthBootstrap';
import SupportChatWidget from './components/support-chat/SupportChatWidget';

function App() {
  useAuthBootstrap();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<AuthSessionExpiredDetail>;
      const noticeMessage =
        customEvent.detail?.noticeMessage ||
        AUTH_SESSION_EXPIRED_NOTICE_MESSAGE;
      const loginPath = ROUTE_PATHS.LOGIN;
      const shouldReplace = isLoginPath(location.pathname);

      navigate(loginPath, {
        replace: shouldReplace,
        state: { noticeMessage },
      });
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, [location.pathname, navigate]);

  return (
    <>
      <Outlet />
      <SupportChatWidget />
    </>
  );
}

export default App;
