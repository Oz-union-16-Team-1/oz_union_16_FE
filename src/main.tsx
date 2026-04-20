import React from 'react';
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
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/mypage/MyPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import './index.css';

const queryClient = new QueryClient();

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
        element: <LoginPage />,
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
        element: <SignupPage />,
      },
      {
        path: ROUTES.LEGACY_SIGNUP,
        element: <LegacyRouteRedirect to={`/${ROUTES.SIGNUP}`} />,
      },
      {
        path: ROUTES.MY_PAGE,
        element: <MyPage />,
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
    onUnhandledRequest: 'bypass',
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
