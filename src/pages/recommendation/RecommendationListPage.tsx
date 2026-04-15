import { Heart, Sparkles, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import { useSurveyResultsInfinite } from '../../features/survey/api/useSurveyApi';
import { extractApiErrorMessage } from '../../features/survey/api/survey';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { getAccessToken } from '../../utils/auth';

function RecommendationListPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isMockMode = isMockServiceWorkerEnabled();
  const hasAccessToken = Boolean(getAccessToken());
  const canAccessPage = isMockMode || hasAccessToken;

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useSurveyResultsInfinite(sessionId);

  const recommendationItems = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-75" />
      <Header fixed isLoggedIn={hasAccessToken} />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 pt-32 pb-16 md:px-8">
        <section className="mb-8 flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#5e1717] bg-[#150707] px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
            <Sparkles size={14} />
            Recommendation List
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              추천 리스트
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
              설문 응답을 바탕으로 정렬된 게임 리스트를 보여줍니다. 지금은 1차
              연결 버전이라 핵심 데이터 흐름과 카드 UI 중심으로 구성했습니다.
            </p>
          </div>
        </section>

        {!canAccessPage ? (
          <section className="survey-panel max-w-2xl px-8 py-10">
            <h2 className="text-2xl font-bold text-white">
              로그인 후 추천 결과를 볼 수 있어요.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60">
              실제 API 모드에서는 인증 토큰이 필요합니다. 개발 중에는 MSW를
              켜두면 설문부터 추천 결과까지 전체 흐름을 확인할 수 있습니다.
            </p>
          </section>
        ) : !sessionId ? (
          <section className="survey-panel max-w-2xl px-8 py-10">
            <h2 className="text-2xl font-bold text-white">
              먼저 설문을 완료해 주세요.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60">
              설문 결과가 준비되면 `session_id`를 기준으로 추천 리스트를
              불러옵니다.
            </p>
            <Link
              to={`/${ROUTES.SURVEY}`}
              className="mt-6 inline-flex rounded-2xl bg-[linear-gradient(135deg,#ff3535,#9f1212)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
            >
              설문 페이지로 이동
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-6 flex items-center justify-between rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-5 backdrop-blur-xl">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-white/42 uppercase">
                  Session
                </p>
                <p className="mt-2 text-sm text-white/65">{sessionId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#ff8c8c]">
                  총 {data?.pages[0]?.count ?? 0}개 추천
                </p>
                <p className="mt-1 text-sm text-white/45">
                  인기순 카드 미리보기
                </p>
              </div>
            </section>

            {isLoading ? (
              <section className="survey-panel px-8 py-12 text-white/65">
                추천 결과를 불러오는 중입니다...
              </section>
            ) : error ? (
              <section className="survey-panel px-8 py-10 text-[#ffc2c2]">
                {extractApiErrorMessage(error)}
              </section>
            ) : (
              <>
                <section className="grid gap-5 md:grid-cols-2">
                  {recommendationItems.map((item) => (
                    <article
                      key={item.game_id}
                      className="overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_28px_55px_rgba(0,0,0,0.32)]"
                    >
                      <div className="relative h-56 overflow-hidden">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[#17181b] text-white/40">
                            이미지 준비 중
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.82))]" />
                      </div>

                      <div className="px-6 py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              {item.name}
                            </h2>
                            <p className="mt-2 text-sm text-white/55">
                              {item.genres.join(' / ')}
                            </p>
                          </div>
                          <button
                            type="button"
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                              item.is_liked
                                ? 'border-[#7f2525] bg-[#220b0b] text-[#ff6666]'
                                : 'border-white/10 bg-white/[0.03] text-white/58'
                            }`}
                            aria-label="좋아요 상태"
                          >
                            <Heart
                              size={18}
                              fill={item.is_liked ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>

                        <div className="mt-5 flex items-center gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-sm text-white/82">
                            <Star size={14} className="text-[#ff9e57]" />
                            {item.rating?.toFixed(1) ?? 'N/A'}
                          </div>
                          <div className="inline-flex rounded-full border border-white/8 px-3 py-1.5 text-sm text-white/56">
                            game_id {item.game_id}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>

                {hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="mx-auto mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingNextPage
                      ? '다음 추천 불러오는 중...'
                      : '다음 추천 더 보기'}
                  </button>
                ) : null}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default RecommendationListPage;
