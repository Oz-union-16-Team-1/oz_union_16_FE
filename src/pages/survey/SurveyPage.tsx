import { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';

import AuthGateStatusPanel from '../../components/auth/AuthGateStatusPanel';
import CenteredLoadingState from '../../components/common/CenteredLoadingState';
import LazyHeader from '../../components/common/LazyHeader';
import { ROUTES } from '../../constants/routes';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import SurveyChatPanel from '../../features/survey/components/SurveyChatPanel';
import { useSurveyStore } from '../../features/survey/store/useSurveyStore';
import { mockTopGames } from '../../features/games/mockGames';
import { useAuthStore } from '../../store/useAuthStore';

const SURVEY_BACKDROP_ITEMS = [...mockTopGames, ...mockTopGames].slice(0, 14);

function SurveyBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid h-full grid-cols-3 gap-3 p-4 opacity-[0.22] saturate-0 sm:grid-cols-4 sm:gap-4 sm:p-6 lg:grid-cols-5 lg:gap-5 lg:p-8">
        {SURVEY_BACKDROP_ITEMS.map((game, index) => (
          <div
            key={`${game.gameId}-${index}`}
            className="overflow-hidden rounded-[28px] border border-white/6 bg-white/3 blur-[14px]"
          >
            <img
              src={game.thumbnailUrl ?? ''}
              alt={game.name}
              className="h-full min-h-45 w-full scale-110 object-cover"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(170,25,25,0.16),transparent_24%),linear-gradient(180deg,rgba(5,5,5,0.46),rgba(5,5,5,0.92))]" />
    </div>
  );
}

function SurveyPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const authGate = useAuthGate();
  const canAccessSurvey = authGate.accessStatus === 'authorized';
  const account = useAuthStore((state) => state.account);
  const syncOwnerKey = useSurveyStore((state) => state.syncOwnerKey);
  const storedOwnerKey = useSurveyStore((state) => state.ownerKey);
  const surveySessionId = useSurveyStore((state) => state.sessionId);
  const messages = useSurveyStore((state) => state.messages);
  const recommendationReady = useSurveyStore(
    (state) => state.recommendationReady,
  );
  const isHistoryMode = searchParams.get('mode') === 'history';
  const [enteredWithCompletedSurvey, setEnteredWithCompletedSurvey] = useState<
    boolean | null
  >(null);
  const surveyOwnerKey = account?.login_id
    ? `survey-user:${account.login_id}`
    : authGate.isAuthenticated &&
        storedOwnerKey &&
        storedOwnerKey !== 'survey-user:authenticated' &&
        storedOwnerKey !== 'survey-user:guest' &&
        storedOwnerKey !== 'survey-user:mock'
      ? storedOwnerKey
      : authGate.isAuthenticated
        ? 'survey-user:authenticated'
        : authGate.canBypassAuth
          ? 'survey-user:mock'
          : 'survey-user:guest';

  useEffect(() => {
    syncOwnerKey(surveyOwnerKey);
  }, [surveyOwnerKey, syncOwnerKey]);
  useEffect(() => {
    if (enteredWithCompletedSurvey !== null) {
      return undefined;
    }

    if (storedOwnerKey !== surveyOwnerKey) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      setEnteredWithCompletedSurvey(
        (current) => current ?? (recommendationReady && messages.length > 0),
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    enteredWithCompletedSurvey,
    messages.length,
    recommendationReady,
    storedOwnerKey,
    surveyOwnerKey,
  ]);
  const shouldRedirectCompletedEntry =
    canAccessSurvey &&
    !isHistoryMode &&
    enteredWithCompletedSurvey === true &&
    recommendationReady &&
    messages.length > 0;

  if (authGate.accessStatus === 'unauthorized') {
    return (
      <Navigate
        to={`/${ROUTES.LOGIN}`}
        replace
        state={{
          noticeMessage: '로그인 후 설문을 시작할 수 있어요.',
          redirectTo: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  if (shouldRedirectCompletedEntry) {
    const recommendationQuery = surveySessionId
      ? `?source=survey&session_id=${encodeURIComponent(surveySessionId)}`
      : '?source=survey';
    return (
      <Navigate
        to={`/${ROUTES.RECOMMENDATION_LIST}${recommendationQuery}`}
        replace
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <SurveyBackdrop />
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-90" />
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pt-[4.85rem] pb-6 sm:px-4 sm:pt-[5.15rem] sm:pb-8 md:h-dvh md:max-h-dvh md:overflow-hidden md:px-8 md:pt-[5.45rem] md:pb-6">
        {authGate.accessStatus === 'loading' ? (
          <CenteredLoadingState
            label="Survey"
            title="AI가 첫 질문을 준비하고 있습니다."
            hint="질문 흐름을 정리하고 있어요."
            className="mx-auto max-w-190"
          />
        ) : canAccessSurvey ? (
          <SurveyChatPanel isHistoryView={isHistoryMode} />
        ) : (
          <AuthGateStatusPanel
            title="로그인 후 설문을 시작할 수 있어요."
            description="로그인하면 취향을 바탕으로 질문을 이어가고, 설문이 끝난 뒤 바로 추천 결과까지 확인할 수 있어요."
            align="center"
            className="mx-auto max-w-190 sm:py-12"
          />
        )}
      </main>
    </div>
  );
}

export default SurveyPage;
