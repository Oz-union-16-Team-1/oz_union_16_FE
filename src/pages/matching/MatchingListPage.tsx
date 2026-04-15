import Header from '../../components/common/Header';
import { getAccessToken } from '../../utils/auth';

function MatchingListPage() {
  const hasAccessToken = Boolean(getAccessToken());

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-75" />
      <Header fixed isLoggedIn={hasAccessToken} />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] px-5 pt-32 pb-16 md:px-8">
        <section className="survey-panel my-auto w-full px-8 py-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
            Matching List
          </p>
          <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
            매칭 페이지는 다음 단계에서 이어집니다.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">
            현재는 설문 플로우와 추천 결과 연결을 먼저 고정해두었습니다. 이후
            장르 기반 카드, 평가 입력, 결과 정렬 UI를 이 페이지에 확장하면
            됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}

export default MatchingListPage;
