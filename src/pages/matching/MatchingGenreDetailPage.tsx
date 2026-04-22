import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import {
  useMatchCandidatesQuery,
  useSubmitMatchResponsesMutation,
} from '../../features/matching/api/useMatchingApi';
import MatchingGuideCards from '../../features/matching/components/MatchingGuideCards';
import MatchingMediaPanel from '../../features/matching/components/MatchingMediaPanel';
import MatchingRatingStars from '../../features/matching/components/MatchingRatingStars';
import {
  getMatchingGenreBySlug,
  isMatchingGenreSlug,
} from '../../features/matching/genres';
import { useMatchingStore } from '../../features/matching/store/useMatchingStore';
import { extractApiErrorMessage } from '../../features/survey/api/survey';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { getAccessToken } from '../../utils/auth';

function MatchingGenreDetailPage() {
  const { genreSlug } = useParams();
  const navigate = useNavigate();
  const hasAccessToken = Boolean(getAccessToken());
  const isMockMode = isMockServiceWorkerEnabled();
  const canAccessPage = isMockMode || hasAccessToken;
  const isValidGenreSlug = genreSlug ? isMatchingGenreSlug(genreSlug) : false;
  const genre = genreSlug ? getMatchingGenreBySlug(genreSlug) : undefined;

  const matchCandidatesQuery = useMatchCandidatesQuery(
    genre?.genreId ?? null,
    canAccessPage,
  );
  const submitMatchResponsesMutation = useSubmitMatchResponsesMutation();
  const resetSubmitMatchResponsesMutation = submitMatchResponsesMutation.reset;
  const candidates = useMemo(
    () => matchCandidatesQuery.data?.results ?? [],
    [matchCandidatesQuery.data?.results],
  );
  const selectedGenreSlug = useMatchingStore(
    (state) => state.selectedGenreSlug,
  );
  const selectedGenreId = useMatchingStore((state) => state.selectedGenreId);
  const flowCandidates = useMatchingStore((state) => state.candidates);
  const currentIndex = useMatchingStore((state) => state.currentIndex);
  const evaluationsByGameId = useMatchingStore(
    (state) => state.evaluationsByGameId,
  );
  const initializeFlow = useMatchingStore((state) => state.initializeFlow);
  const setRating = useMatchingStore((state) => state.setRating);
  const toggleLiked = useMatchingStore((state) => state.toggleLiked);
  const goNext = useMatchingStore((state) => state.goNext);
  const goPrevious = useMatchingStore((state) => state.goPrevious);

  useEffect(() => {
    if (!genre || candidates.length === 0) {
      return;
    }

    initializeFlow(genre, candidates);
    resetSubmitMatchResponsesMutation();
  }, [genre, candidates, initializeFlow, resetSubmitMatchResponsesMutation]);

  const displayCandidates =
    selectedGenreSlug === genre?.slug &&
    selectedGenreId === genre?.genreId &&
    flowCandidates.length > 0
      ? flowCandidates
      : candidates;
  const totalSteps = displayCandidates.length;
  const totalGamesLabel = `${totalSteps}개의 게임`;
  const safeIndex =
    totalSteps > 0 ? Math.min(currentIndex, totalSteps - 1) : currentIndex;
  const currentCandidate = displayCandidates[safeIndex];
  const currentEvaluation = currentCandidate
    ? (evaluationsByGameId[currentCandidate.game_id] ?? {
        rating: null,
        isLiked: currentCandidate.is_liked,
      })
    : null;
  const isLastCard = totalSteps > 0 && safeIndex === totalSteps - 1;
  const hasSelectedRating = currentEvaluation?.rating !== null;
  const canGoPrevious = safeIndex > 0;
  const allCandidatesRated =
    displayCandidates.length > 0 &&
    displayCandidates.every(
      (candidate) => evaluationsByGameId[candidate.game_id]?.rating !== null,
    );
  const submitErrorMessage = submitMatchResponsesMutation.error
    ? extractApiErrorMessage(submitMatchResponsesMutation.error)
    : null;

  const handleSubmit = async () => {
    if (!allCandidatesRated || displayCandidates.length === 0) {
      return;
    }

    try {
      await submitMatchResponsesMutation.mutateAsync({
        match_result: displayCandidates.map((candidate) => ({
          game_id: candidate.game_id,
          rating: evaluationsByGameId[candidate.game_id]!.rating!,
          is_liked: evaluationsByGameId[candidate.game_id]!.isLiked,
        })),
      });
      navigate(`/${ROUTES.RECOMMENDATION_LIST}?source=match`);
    } catch {
      return;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,25,25,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)] opacity-90" />
      <Header fixed />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-[1120px] px-4 pt-[5.5rem] pb-12 sm:px-6 sm:pt-24 md:px-8 md:pt-[6.25rem] md:pb-14">
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
          <section className="mx-auto max-w-[960px]">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
                {safeIndex + 1} / {totalSteps} 단계
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[40px]">
                매칭 과정을 따라가세요
              </h1>
              <p className="mt-3 text-sm leading-6 break-keep text-white/58 sm:text-[15px]">
                {totalGamesLabel}을 차례대로 평가하고, 마음에 드는 게임은 하트로
                표시해둘 수 있어요.
              </p>
            </div>

            <div className="mt-7">
              <MatchingGuideCards />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              {currentCandidate ? (
                <MatchingMediaPanel
                  candidate={currentCandidate}
                  genreTitle={genre.title}
                  stepLabel={`${safeIndex + 1} / ${totalSteps} 단계`}
                />
              ) : null}

              {currentCandidate && currentEvaluation ? (
                <article className="survey-panel flex flex-col px-5 py-6 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold tracking-[0.2em] text-[#f06b6b] uppercase">
                        Candidate {safeIndex + 1}
                      </p>
                      <h2 className="mt-2.5 text-2xl font-semibold tracking-[-0.02em] break-keep text-white sm:text-[28px]">
                        {currentCandidate.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLiked(currentCandidate.game_id)}
                      aria-pressed={currentEvaluation.isLiked}
                      aria-label={
                        currentEvaluation.isLiked
                          ? '좋아요 해제'
                          : '좋아요 추가'
                      }
                      className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d93737] ${
                        currentEvaluation.isLiked
                          ? 'border-[#c12626]/70 bg-[#220b0b] text-[#f25a5a]'
                          : 'border-white/10 bg-white/[0.03] text-white/54 hover:border-white/20 hover:text-white/80'
                      }`}
                    >
                      <Heart
                        size={20}
                        fill={
                          currentEvaluation.isLiked ? 'currentColor' : 'none'
                        }
                      />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-white/46">
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                      장르 {currentCandidate.genres.join(' · ')}
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                      평균 평점 {currentCandidate.rating?.toFixed(1) ?? 'N/A'}
                    </span>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-semibold text-white">
                      이 게임은 얼마나 끌리나요?
                    </p>
                    <p className="mt-1.5 text-sm leading-6 break-keep text-white/55">
                      별점을 남기면 다음 카드로 넘어갈 수 있어요.
                    </p>
                    <div className="mt-4">
                      <MatchingRatingStars
                        value={currentEvaluation.rating}
                        onRate={(rating) =>
                          setRating(currentCandidate.game_id, rating)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p className="text-sm leading-7 break-keep text-white/64">
                      {isLastCard
                        ? currentEvaluation.rating === null
                          ? '마지막 후보예요. 별점을 선택하면 지금까지 남긴 평가를 한 번에 제출할 수 있어요.'
                          : '모든 평가가 준비됐어요. 제출하면 추천 결과를 바로 확인할 수 있어요.'
                        : currentEvaluation.rating === null
                          ? '현재 카드의 별점을 먼저 선택해 주세요.'
                          : '별점과 좋아요는 바로 저장되고, 이전 카드로 돌아가 수정할 수도 있어요.'}
                    </p>
                  </div>

                  {submitErrorMessage ? (
                    <p className="mt-3 text-sm leading-6 break-keep text-[#ffc2c2]">
                      {submitErrorMessage}
                    </p>
                  ) : null}

                  {isLastCard ? (
                    <div className="mt-auto pt-6">
                      <p className="mx-auto mb-3 w-full max-w-[420px] text-center text-sm leading-6 break-keep text-white/42">
                        {totalSteps}개 게임의 평가가 모두 준비되면 제출할 수
                        있어요.
                      </p>

                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <button
                          type="button"
                          onClick={goPrevious}
                          disabled={!canGoPrevious}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-white/28"
                        >
                          <ChevronLeft size={16} />
                          이전
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleSubmit()}
                          disabled={
                            !allCandidatesRated ||
                            submitMatchResponsesMutation.isPending
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-[#c91818] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b11212] disabled:cursor-not-allowed disabled:bg-[#5c1a1a] disabled:text-white/44"
                        >
                          {submitMatchResponsesMutation.isPending
                            ? '제출 중...'
                            : '제출하기'}
                          {!submitMatchResponsesMutation.isPending ? (
                            <ChevronRight size={16} />
                          ) : null}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                      <button
                        type="button"
                        onClick={goPrevious}
                        disabled={!canGoPrevious}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-white/28"
                      >
                        <ChevronLeft size={16} />
                        이전
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!hasSelectedRating}
                        className="inline-flex items-center gap-2 rounded-full bg-[#c91818] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b11212] disabled:cursor-not-allowed disabled:bg-[#5c1a1a] disabled:text-white/44"
                      >
                        다음
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </article>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
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
