import { ChevronLeft, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router';

import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import {
  getMatchingGenreBySlug,
  isMatchingGenreSlug,
} from '../../features/matching/genres';
import { getAccessToken } from '../../utils/auth';

function MatchingGenreDetailPage() {
  const { genreSlug } = useParams();
  const hasAccessToken = Boolean(getAccessToken());
  const isValidGenreSlug = genreSlug ? isMatchingGenreSlug(genreSlug) : false;
  const genre = genreSlug ? getMatchingGenreBySlug(genreSlug) : undefined;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,25,25,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)] opacity-90" />
      <Header fixed isLoggedIn={hasAccessToken} />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-[1180px] px-4 pt-24 pb-14 sm:px-6 sm:pt-28 md:px-8 md:pt-32 md:pb-18">
        {!genre || !isValidGenreSlug ? (
          <section className="survey-panel mx-auto max-w-[760px] px-6 py-10 sm:px-8 sm:py-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
              Matching
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              선택한 장르를 찾을 수 없어요.
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
              잘못된 경로로 접근했거나 아직 준비되지 않은 장르입니다. 장르 선택
              화면으로 돌아가서 다시 시작해보세요.
            </p>
            <Link
              to={`/${ROUTES.MATCHING_LIST}`}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
            >
              <ChevronLeft size={16} />
              장르 선택으로 돌아가기
            </Link>
          </section>
        ) : (
          <section className="mx-auto grid max-w-[980px] gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <article className="overflow-hidden rounded-[28px] border border-white/8 bg-[#0d0d0f] shadow-[0_28px_56px_rgba(0,0,0,0.32)]">
              <div className="relative h-full min-h-[280px]">
                <img
                  src={genre.thumbnailUrl}
                  alt={genre.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.18),rgba(8,8,10,0.78))]" />
                <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8">
                  <p className="text-[11px] font-medium tracking-[0.22em] text-white/68 uppercase">
                    {genre.subtitle}
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-[40px]">
                    {genre.title}
                  </h1>
                </div>
              </div>
            </article>

            <article className="survey-panel px-6 py-8 sm:px-8 sm:py-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/52 uppercase">
                <Sparkles size={14} />
                Genre Selected
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-[30px]">
                {genre.title}
              </h2>
              <p className="mt-3 text-base leading-7 break-keep text-white/60">
                {genre.description}
              </p>
              <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-5">
                <p className="text-sm leading-7 break-keep text-white/68">
                  2단계에서는 이 장르에 맞는 5개 게임 카드가 순서대로 등장하고,
                  별점과 찜 여부를 남기면서 실제 매칭 플로우를 진행하게 됩니다.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={`/${ROUTES.MATCHING_LIST}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
                >
                  <ChevronLeft size={16} />
                  다른 장르 보기
                </Link>
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

export default MatchingGenreDetailPage;
