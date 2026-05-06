import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import GuestOnlyRoute from './components/auth/GuestOnlyRoute';
import MainPageLoadingFallback from './components/common/MainPageLoadingFallback';
import LegacyRouteRedirect from './components/common/LegacyRouteRedirect';
import { ROUTE_PATHS, ROUTES } from './constants/routes';
import { isMockServiceWorkerEnabled } from './lib/env';
import MatchingListPage from './pages/matching/MatchingListPage';
import MatchingGenreDetailPage from './pages/matching/MatchingGenreDetailPage';
import MainPage from './pages/main/MainPage';
import RecommendationListPage from './pages/recommendation/RecommendationListPage';
import SurveyPage from './pages/survey/SurveyPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import RouteErrorPage from './pages/RouteErrorPage';
import './index.css';

const queryClient = new QueryClient();
// eslint-disable-next-line react-refresh/only-export-components
const LazyLoginPage = lazy(() => import('./pages/LoginPage'));
// eslint-disable-next-line react-refresh/only-export-components
const LazySignupPage = lazy(() => import('./pages/SignupPage'));
// eslint-disable-next-line react-refresh/only-export-components
const LazyMyPage = lazy(() => import('./pages/mypage/MyPage'));

const authPageFallback = <MainPageLoadingFallback />;

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      {
        path: ROUTES.SURVEY,
        element: <SurveyPage />,
      },
      {
        path: ROUTES.MATCHING_LIST,
        element: <MatchingListPage />,
      },
      {
        path: ROUTES.MATCHING_GENRE_DETAIL,
        element: <MatchingGenreDetailPage />,
      },
      {
        path: ROUTES.RECOMMENDATION_LIST,
        element: <RecommendationListPage />,
      },
      {
        path: ROUTES.LOGIN,
        element: (
          <Suspense fallback={authPageFallback}>
            <LazyLoginPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.AUTH_CALLBACK,
        element: <AuthCallbackPage />,
      },
      {
        path: ROUTES.LEGACY_AUTH_CALLBACK,
        element: <LegacyRouteRedirect to={ROUTE_PATHS.AUTH_CALLBACK} />,
      },
      {
        path: ROUTES.SIGNUP,
        element: (
          <GuestOnlyRoute loadingFallback={authPageFallback}>
            <Suspense fallback={authPageFallback}>
              <LazySignupPage />
            </Suspense>
          </GuestOnlyRoute>
        ),
      },
      {
        path: ROUTES.LEGACY_SIGNUP,
        element: <LegacyRouteRedirect to={ROUTE_PATHS.SIGNUP} />,
      },
      {
        path: ROUTES.MY_PAGE,
        element: (
          <Suspense fallback={authPageFallback}>
            <LazyMyPage />
          </Suspense>
        ),
      },
    ],
  },
]);

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
};

const disableMocking = async () => {
  if (!import.meta.env.DEV) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  worker.stop();
};

const enableMocking = async () => {
  if (!isMockServiceWorkerEnabled()) {
    await disableMocking();
    return;
  }

  const { worker } = await import('./mocks/browser');

  await worker.start({
    // DEV + MSW 환경에서 API 핸들러 누락을 빠르게 찾기 위한 로깅 정책.
    onUnhandledRequest: (request, print) => {
      const { pathname } = new URL(request.url);
      const isApiRequest = pathname.startsWith('/api/');

      if (isApiRequest) {
        print.warning();
      }
    },
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
};

void enableMocking()
  .catch((error) => {
    console.error('MSW 초기화에 실패했습니다.', error);
  })
  .finally(renderApp);
