import { useEffect } from 'react';

import Header from '../../components/common/Header';
import SurveyChatPanel from '../../features/survey/components/SurveyChatPanel';
import { useSurveyStore } from '../../features/survey/store/useSurveyStore';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { useAuthStore } from '../../store/useAuthStore';
import { getAccessToken } from '../../utils/auth';

function SurveyPage() {
  const hasAccessToken = Boolean(getAccessToken());
  const isMockMode = isMockServiceWorkerEnabled();
  const canAccessSurvey = isMockMode || hasAccessToken;
  const account = useAuthStore((state) => state.account);
  const syncOwnerKey = useSurveyStore((state) => state.syncOwnerKey);
  const surveyOwnerKey = account?.login_id
    ? `survey-user:${account.login_id}`
    : hasAccessToken
      ? 'survey-user:authenticated'
      : isMockMode
        ? 'survey-user:mock'
        : 'survey-user:guest';

  useEffect(() => {
    syncOwnerKey(surveyOwnerKey);
  }, [surveyOwnerKey, syncOwnerKey]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-90" />
      <Header fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-3 pt-[4.85rem] pb-6 sm:px-4 sm:pt-[5.15rem] sm:pb-8 md:h-[100dvh] md:max-h-[100dvh] md:overflow-hidden md:px-8 md:pt-[5.45rem] md:pb-6">
        {canAccessSurvey ? (
          <SurveyChatPanel />
        ) : (
          <section className="survey-panel max-w-2xl px-8 py-10">
            <h2 className="text-2xl font-bold text-white">
              로그인 후 설문을 시작할 수 있어요.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60">
              로그인하면 취향을 바탕으로 질문을 이어가고, 설문이 끝난 뒤 바로
              추천 결과까지 확인할 수 있어요.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default SurveyPage;
