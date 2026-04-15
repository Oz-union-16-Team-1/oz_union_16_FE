import Header from '../../components/common/Header';
import SurveyChatPanel from '../../features/survey/components/SurveyChatPanel';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { getAccessToken } from '../../utils/auth';

function SurveyPage() {
  const hasAccessToken = Boolean(getAccessToken());
  const isMockMode = isMockServiceWorkerEnabled();
  const canAccessSurvey = isMockMode || hasAccessToken;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-90" />
      <Header fixed isLoggedIn={hasAccessToken} />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-3 pt-24 pb-10 sm:px-4 sm:pt-28 sm:pb-12 md:px-8 md:pt-32 md:pb-16">
        <section className="mb-8 flex flex-col gap-5">
          <div className="inline-flex w-fit items-center rounded-full border border-[#5e1717] bg-[#150707] px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
            Survey Experience
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              설문 조사
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
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
              실제 API 모드에서는 인증된 사용자만 설문 세션을 생성할 수
              있습니다. 개발 중에는 `VITE_USE_MSW`를 활성화하면 로그인 없이도
              설문 체험이 가능합니다.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default SurveyPage;
