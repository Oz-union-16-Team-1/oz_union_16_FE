import { useEffect } from 'react';

import AuthGateStatusPanel from '../../components/auth/AuthGateStatusPanel';
import Header from '../../components/common/Header';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import SurveyChatPanel from '../../features/survey/components/SurveyChatPanel';
import { useSurveyStore } from '../../features/survey/store/useSurveyStore';
import { useAuthStore } from '../../store/useAuthStore';

function SurveyPage() {
  const authGate = useAuthGate({ allowMockBypass: true });
  const canAccessSurvey = authGate.accessStatus === 'authorized';
  const account = useAuthStore((state) => state.account);
  const syncOwnerKey = useSurveyStore((state) => state.syncOwnerKey);
  const surveyOwnerKey = account?.login_id
    ? `survey-user:${account.login_id}`
    : authGate.isAuthenticated
      ? 'survey-user:authenticated'
      : authGate.canBypassAuth
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
        {authGate.accessStatus === 'loading' ? (
          <AuthGateStatusPanel
            title="인증 상태를 확인하는 중입니다."
            description="잠시만 기다려 주세요. 세션 확인 후 설문 화면을 이어서 보여드릴게요."
          />
        ) : canAccessSurvey ? (
          <SurveyChatPanel />
        ) : (
          <AuthGateStatusPanel
            title="로그인 후 설문을 시작할 수 있어요."
            description="로그인하면 취향을 바탕으로 질문을 이어가고, 설문이 끝난 뒤 바로 추천 결과까지 확인할 수 있어요."
          />
        )}
      </main>
    </div>
  );
}

export default SurveyPage;
