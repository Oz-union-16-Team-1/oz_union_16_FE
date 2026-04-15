import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App';
import { ROUTES } from './constants/routes';
import { isMockServiceWorkerEnabled } from './lib/env';
import GameDetailPlaceholder from './pages/game/GameDetailPlaceholder';
import MatchingListPage from './pages/matching/MatchingListPage';
import MainPage from './pages/main/MainPage';
import RecommendationListPage from './pages/recommendation/RecommendationListPage';
import SurveyPage from './pages/survey/SurveyPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
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
        path: 'games/:gameId',
        element: <GameDetailPlaceholder />,
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
        path: ROUTES.RECOMMENDATION_LIST,
        element: <RecommendationListPage />,
      },
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.SIGNUP,
        element: <SignupPage />,
      },
    ],
  },
]);

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
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
