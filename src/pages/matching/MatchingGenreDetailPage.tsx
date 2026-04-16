import { ChevronLeft, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router';

import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import { useMatchCandidatesQuery } from '../../features/matching/api/useMatchingApi';
import {
  getMatchingGenreBySlug,
  isMatchingGenreSlug,
} from '../../features/matching/genres';
import { extractApiErrorMessage } from '../../features/survey/api/survey';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { getAccessToken } from '../../utils/auth';

function MatchingGenreDetailPage() {
  const { genreSlug } = useParams();
  const hasAccessToken = Boolean(getAccessToken());
  const isMockMode = isMockServiceWorkerEnabled();
  const canAccessPage = isMockMode || hasAccessToken;
  const isValidGenreSlug = genreSlug ? isMatchingGenreSlug(genreSlug) : false;
  const genre = genreSlug ? getMatchingGenreBySlug(genreSlug) : undefined;

  const matchCandidatesQuery = useMatchCandidatesQuery(
    genre?.genreId ?? null,
    canAccessPage,
  );
  const candidates = matchCandidatesQuery.data?.results ?? [];

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
        ) : !canAccessPage ? (
          <section className="survey-panel mx-auto max-w-[760px] px-6 py-10 sm:px-8 sm:py-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
              Matching
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              로그인 후 매칭을 진행할 수 있어요.
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
              실제 API 모드에서는 인증 토큰이 필요합니다. 개발 환경에서 MSW를
              켜두면 로그인 없이도 매칭 흐름을 확인할 수 있어요.
            </p>
          </section>
        ) : matchCandidatesQuery.isLoading ? (
          <section className="survey-panel mx-auto max-w-[760px] px-6 py-10 text-center text-white/68 sm:px-8 sm:py-12">
            매칭 후보 게임을 불러오는 중입니다...
          </section>
        ) : matchCandidatesQuery.error ? (
          <section className="survey-panel mx-auto max-w-[760px] px-6 py-10 sm:px-8 sm:py-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
              Matching
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              매칭 후보를 불러오지 못했어요.
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
              {extractApiErrorMessage(matchCandidatesQuery.error)}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void matchCandidatesQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                다시 시도
              </button>
              <Link
                to={`/${ROUTES.MATCHING_LIST}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                <ChevronLeft size={16} />
                장르 선택으로 돌아가기
              </Link>
            </div>
          </section>
        ) : candidates.length === 0 ? (
          <section className="survey-panel mx-auto max-w-[760px] px-6 py-10 sm:px-8 sm:py-12">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              이 장르에 준비된 후보 게임이 아직 없어요.
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
              잠시 후 다시 시도하거나 다른 장르에서 먼저 매칭을 진행해보세요.
            </p>
            <Link
              to={`/${ROUTES.MATCHING_LIST}`}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
            >
              <ChevronLeft size={16} />
              다른 장르 보기
            </Link>
          </section>
        ) : (
          <section className="mx-auto max-w-[980px]">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
                Matching Candidates
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[44px]">
                {genre.title} 후보 게임이 준비되었어요
              </h1>
              <p className="mt-4 text-sm leading-7 break-keep text-white/58 sm:text-base">
                최신 명세 기준으로 후보 조회 계약과 MSW 연동이 먼저 연결된
                상태입니다. 다음 단계에서는 이 5개 게임을 실제로 평가하는
                인터랙션 화면이 붙게 됩니다.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="overflow-hidden rounded-[28px] border border-white/8 bg-[#0d0d0f] shadow-[0_26px_52px_rgba(0,0,0,0.28)]">
                <div className="relative">
                  <img
                    src={genre.thumbnailUrl}
                    alt={genre.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.14),rgba(8,8,10,0.76))]" />
                  <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8">
                    <p className="text-[11px] font-medium tracking-[0.22em] text-white/64 uppercase">
                      {genre.subtitle}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-[40px]">
                      {genre.title}
                    </h2>
                    <p className="mt-4 max-w-[56ch] text-sm leading-7 break-keep text-white/70 sm:text-base">
                      {genre.description}
                    </p>
                  </div>
                </div>
              </article>

              <article className="survey-panel px-6 py-8 sm:px-8 sm:py-9">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/52 uppercase">
                  <Sparkles size={14} />
                  Candidates Ready
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-[30px]">
                  총 {matchCandidatesQuery.data?.count ?? candidates.length}개의
                  평가 대상
                </h2>
                <p className="mt-3 text-base leading-7 break-keep text-white/60">
                  지금은 후보 조회 단계까지만 연결된 상태예요. 다음 단계에서
                  별점과 좋아요를 남기며 실제 매칭을 진행하게 됩니다.
                </p>
                <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-5">
                  <p className="text-sm leading-7 break-keep text-white/68">
                    `GET /api/v1/match/candidates?genre_id={genre.genreId}`
                    계약과 MSW 데이터가 연결되어, 장르별 5개 후보를 안정적으로
                    불러올 수 있어요.
                  </p>
                </div>
              </article>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {candidates.map((candidate) => (
                <article
                  key={candidate.game_id}
                  className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.9),rgba(10,10,11,0.96))] shadow-[0_18px_34px_rgba(0,0,0,0.2)]"
                >
                  {candidate.thumbnail_url ? (
                    <img
                      src={candidate.thumbnail_url}
                      alt={candidate.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[16/9] w-full bg-[#151517]" />
                  )}
                  <div className="px-5 py-5">
                    <p className="text-[11px] font-medium tracking-[0.2em] text-white/34 uppercase">
                      Candidate {candidate.game_id}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">
                      {candidate.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 break-keep text-white/56">
                      {candidate.genres.join(' · ')}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/44">
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                        평점 {candidate.rating?.toFixed(1) ?? 'N/A'}
                      </span>
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                        좋아요 {candidate.is_liked ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void matchCandidatesQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                후보 다시 불러오기
              </button>
              <Link
                to={`/${ROUTES.MATCHING_LIST}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                <ChevronLeft size={16} />
                다른 장르 보기
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default MatchingGenreDetailPage;
