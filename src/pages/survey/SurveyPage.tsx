import { useLayoutEffect } from 'react';

import Header from '../../components/common/Header';
import SurveyChatPanel from '../../features/survey/components/SurveyChatPanel';
import { useSurveyStore } from '../../features/survey/store/useSurveyStore';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { getAccessToken } from '../../utils/auth';

function SurveyPage() {
  const hasAccessToken = Boolean(getAccessToken());
  const isMockMode = isMockServiceWorkerEnabled();
  const canAccessSurvey = isMockMode || hasAccessToken;
  const resetSurveyState = useSurveyStore((state) => state.resetSurveyState);

  useLayoutEffect(() => {
    resetSurveyState();
  }, [resetSurveyState]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-90" />
      <Header fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-3 pt-[5.5rem] pb-8 sm:px-4 sm:pt-24 sm:pb-10 md:h-[100dvh] md:max-h-[100dvh] md:overflow-hidden md:px-8 md:pt-[6.5rem] md:pb-8">
        <section className="mb-5 flex shrink-0 flex-col gap-3 md:mb-4 md:gap-2.5">
          <div className="inline-flex w-fit items-center rounded-full border border-[#5e1717] bg-[#150707] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
            개인화 설문
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[44px]">
              설문 조사
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-base md:mt-2.5">
              대화형 AI 설문으로 플레이 스타일을 빠르게 파악하고, 이어지는 추천
              리스트까지 자연스럽게 연결합니다.
            </p>
          </div>
        </section>

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
