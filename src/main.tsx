import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import LegacyRouteRedirect from './components/common/LegacyRouteRedirect';
import { ROUTES } from './constants/routes';
import { isMockServiceWorkerEnabled } from './lib/env';
import MatchingListPage from './pages/matching/MatchingListPage';
import MatchingGenreDetailPage from './pages/matching/MatchingGenreDetailPage';
import MainPage from './pages/main/MainPage';
import RecommendationListPage from './pages/recommendation/RecommendationListPage';
import SurveyPage from './pages/survey/SurveyPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import './index.css';

const queryClient = new QueryClient();
// eslint-disable-next-line react-refresh/only-export-components
const LazyLoginPage = lazy(() => import('./pages/LoginPage'));
// eslint-disable-next-line react-refresh/only-export-components
const LazySignupPage = lazy(() => import('./pages/SignupPage'));
// eslint-disable-next-line react-refresh/only-export-components
const LazyMyPage = lazy(() => import('./pages/mypage/MyPage'));

const authPageFallback = (
  <div className="bg-login-page flex min-h-dvh flex-col text-white">
    <div className="header-shell h-16 w-full lg:h-18" aria-hidden="true" />
    <main className="auth-layout-main relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div aria-hidden="true" className="auth-layout-backdrop" />
      <div aria-hidden="true" className="auth-layout-grid" />
      <section className="auth-layout-panel w-full max-w-[520px] rounded-[28px] border px-4 py-5 backdrop-blur-sm sm:rounded-3xl sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-[440px] text-center text-white/68">
          화면을 불러오는 중입니다...
        </div>
      </section>
    </main>
  </div>
);

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <App />,
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
        element: <LegacyRouteRedirect to={`/${ROUTES.AUTH_CALLBACK}`} />,
      },
      {
        path: ROUTES.SIGNUP,
        element: (
          <Suspense fallback={authPageFallback}>
            <LazySignupPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.LEGACY_SIGNUP,
        element: <LegacyRouteRedirect to={`/${ROUTES.SIGNUP}`} />,
      },
      {
        path: ROUTES.MY_PAGE,
        element: (
          <Suspense
            fallback={
              <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
                <div className="app-aurora pointer-events-none absolute inset-0 opacity-70" />
                <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1240px] items-center justify-center px-4 text-center text-white/70 sm:px-6 md:px-8">
                  마이페이지를 불러오는 중입니다...
                </main>
              </div>
            }
          >
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

const enableMocking = async () => {
  if (!isMockServiceWorkerEnabled()) {
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
