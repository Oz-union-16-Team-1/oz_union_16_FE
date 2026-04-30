import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router';

import AuthGateStatusPanel from '../../components/auth/AuthGateStatusPanel';
import LazyHeader from '../../components/common/LazyHeader';
import { ROUTES } from '../../constants/routes';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import { likeGame, unlikeGame } from '../../features/games/gameApi';
import { syncLikeMutationStateInQueryCache } from '../../features/games/queryCache';
import type { MatchingCandidateItem } from '../../features/matching/types';
import {
  useMatchCandidatesQuery,
  useSubmitMatchResponsesMutation,
} from '../../features/matching/api/useMatchingApi';
import MatchingMediaPanel from '../../features/matching/components/MatchingMediaPanel';
import MatchingRatingStars from '../../features/matching/components/MatchingRatingStars';
import {
  getMatchingGenreBySlug,
  isMatchingGenreSlug,
} from '../../features/matching/genres';
import { useMatchingStore } from '../../features/matching/store/useMatchingStore';
import { extractApiErrorMessage } from '../../features/survey/api/survey';

const MATCHING_LIKE_LOGIN_REQUIRED_MESSAGE =
  '로그인 후 좋아요를 사용할 수 있어요.';
const MATCHING_LIKE_ERROR_MESSAGE =
  '좋아요 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.';
const MATCHING_CANDIDATES_NETWORK_ERROR_MESSAGE =
  '매칭 후보 서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';

const formatMatchingCandidateRating = (rating: number | null) => {
  if (typeof rating !== 'number') {
    return 'N/A';
  }

  const normalizedRating = rating <= 5 ? rating * 20 : rating;

  return `${normalizedRating.toFixed(1)}점`;
};

const getMatchingLikeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError && error.response?.status === 401) {
    return MATCHING_LIKE_LOGIN_REQUIRED_MESSAGE;
  }

  return MATCHING_LIKE_ERROR_MESSAGE;
};

const getMatchCandidatesErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return MATCHING_CANDIDATES_NETWORK_ERROR_MESSAGE;
    }

    if (error.response.status === 400) {
      return '요청한 장르 정보가 올바르지 않습니다. 장르를 다시 선택해 주세요.';
    }

    if (error.response.status === 404) {
      return '해당 장르의 매칭 후보 게임이 아직 준비되지 않았습니다.';
    }
  }

  return extractApiErrorMessage(error);
};

function MatchingDetailSkeleton() {
  return (
    <section className="mx-auto mt-9 max-w-255 animate-pulse sm:mt-10 md:mt-12">
      <div className="text-center">
        <div className="mx-auto h-4 w-20 rounded-full bg-[#792222]/35" />
        <div className="mx-auto mt-3 h-10 w-72 rounded-full bg-white/9" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.32fr_0.92fr] lg:gap-5 xl:mt-9">
        <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[#0c0c0d] p-3">
          <div className="aspect-video rounded-[22px] bg-white/[0.05]" />
          <div className="mt-4 h-4 w-28 rounded-full bg-white/8" />
          <div className="mt-3 h-4 w-full rounded-full bg-white/7" />
          <div className="mt-2 h-4 w-5/6 rounded-full bg-white/7" />
        </div>

        <div className="survey-panel flex flex-col px-5 py-5 sm:px-6 sm:py-6">
          <div className="h-9 w-2/3 rounded-full bg-white/9" />
          <div className="mt-4 h-4 w-full rounded-full bg-white/7" />
          <div className="mt-2 h-4 w-4/5 rounded-full bg-white/7" />

          <div className="mt-5 grid gap-1.5 sm:grid-cols-2">
            <div className="h-16 rounded-[14px] border border-white/8 bg-white/3" />
            <div className="h-16 rounded-[14px] border border-white/8 bg-white/3" />
          </div>

          <div className="mt-7 h-4 w-44 rounded-full bg-white/8" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-10 rounded-full bg-white/[0.06]"
              />
            ))}
          </div>

          <div className="mt-auto pt-8">
            <div className="flex gap-3">
              <div className="h-12 flex-1 rounded-full bg-white/[0.05]" />
              <div className="h-12 flex-1 rounded-full bg-white/[0.08]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchingGenreDetailPage() {
  const { genreSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authGate = useAuthGate();
  const canAccessPage = authGate.accessStatus === 'authorized';
  const isValidGenreSlug = genreSlug ? isMatchingGenreSlug(genreSlug) : false;
  const genre = genreSlug ? getMatchingGenreBySlug(genreSlug) : undefined;

  const matchCandidatesQuery = useMatchCandidatesQuery(
    genre?.genreId ?? null,
    undefined,
    canAccessPage,
  );
  const candidateRetryNo = matchCandidatesQuery.data?.retry_no ?? 0;
  const submitMatchResponsesMutation = useSubmitMatchResponsesMutation();
  const resetSubmitMatchResponsesMutation = submitMatchResponsesMutation.reset;
  const candidates = useMemo(
    () => matchCandidatesQuery.data?.results ?? [],
    [matchCandidatesQuery.data?.results],
  );
  const currentIndex = useMatchingStore((state) => state.currentIndex);
  const evaluationsByGameId = useMatchingStore(
    (state) => state.evaluationsByGameId,
  );
  const restartFlow = useMatchingStore((state) => state.restartFlow);
  const setRating = useMatchingStore((state) => state.setRating);
  const goNext = useMatchingStore((state) => state.goNext);
  const goPrevious = useMatchingStore((state) => state.goPrevious);
  const resetFlow = useMatchingStore((state) => state.resetFlow);
  const hasInitializedFlowRef = useRef(false);
  const [likeFeedbackMessage, setLikeFeedbackMessage] = useState<string | null>(
    null,
  );

  useLayoutEffect(() => {
    resetFlow();
    resetSubmitMatchResponsesMutation();
  }, [resetFlow, resetSubmitMatchResponsesMutation]);

  useEffect(() => {
    hasInitializedFlowRef.current = false;
  }, [genre?.slug, matchCandidatesQuery.dataUpdatedAt]);

  useEffect(() => {
    if (!genre || candidates.length === 0 || hasInitializedFlowRef.current) {
      return;
    }

    restartFlow(genre, candidates);
    hasInitializedFlowRef.current = true;
    resetSubmitMatchResponsesMutation();
  }, [genre, candidates, restartFlow, resetSubmitMatchResponsesMutation]);

  const displayCandidates = candidates;
  const totalSteps = displayCandidates.length;
  const safeIndex =
    totalSteps > 0 ? Math.min(currentIndex, totalSteps - 1) : currentIndex;
  const currentCandidate = displayCandidates[safeIndex];
  const currentEvaluation = currentCandidate
    ? (evaluationsByGameId[currentCandidate.game_id] ?? {
        rating: null,
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
  const genreTitle = genre?.title ?? '선택한 장르';
  const currentCandidateSummary = currentCandidate
    ? currentCandidate.description?.trim() ||
      `${genreTitle} 흐름에서 ${currentCandidate.title}은 ${currentCandidate.genres.join(
        ' · ',
      )} 감각을 대표하는 후보예요. 트레일러를 보고 취향에 얼마나 맞는지 편하게 판단해보세요.`
    : '';
  const likeMutation = useMutation({
    mutationFn: ({
      candidate,
      nextIsLiked,
    }: {
      candidate: MatchingCandidateItem;
      nextIsLiked: boolean;
    }) =>
      nextIsLiked ? likeGame(candidate.game_id) : unlikeGame(candidate.game_id),
    onMutate: async () => {
      setLikeFeedbackMessage(null);
    },
    onSuccess: (response, variables) => {
      syncLikeMutationStateInQueryCache(queryClient, {
        gameId: response.gameId,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
        likedGame: {
          gameId: variables.candidate.game_id,
          title: variables.candidate.title,
          thumbnailUrl: variables.candidate.thumbnail_url,
          genres: variables.candidate.genres,
        },
      });
    },
    onError: (error) => {
      setLikeFeedbackMessage(getMatchingLikeErrorMessage(error));
    },
  });

  if (authGate.accessStatus === 'unauthorized') {
    return (
      <Navigate
        to={`/${ROUTES.LOGIN}`}
        replace
        state={{
          noticeMessage: '로그인 후 매칭을 진행할 수 있어요.',
          redirectTo: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  const handleSubmit = async () => {
    if (!genre || !allCandidatesRated || displayCandidates.length === 0) {
      return;
    }

    const currentGenreId = genre.genreId;

    try {
      await submitMatchResponsesMutation.mutateAsync({
        genre_id: currentGenreId,
        retry_no: candidateRetryNo,
        match_result: displayCandidates.map((candidate) => ({
          game_id: candidate.game_id,
          rating: evaluationsByGameId[candidate.game_id]!.rating!,
          is_liked: candidate.is_liked,
        })),
      });
      queryClient.removeQueries({
        queryKey: ['match-candidates', currentGenreId],
      });
      navigate(
        `/${ROUTES.RECOMMENDATION_LIST}?source=match&genre_id=${currentGenreId}`,
      );
    } catch {
      return;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,25,25,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)] opacity-90" />
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-280 px-4 pt-[6.35rem] pb-10 sm:px-6 sm:pt-[6.8rem] sm:pb-12 md:px-8 md:pt-[7.35rem] md:pb-14">
        {!genre || !isValidGenreSlug ? (
          <section className="survey-panel mx-auto max-w-190 px-6 py-10 sm:px-8 sm:py-12">
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
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
            >
              <ChevronLeft size={16} />
              장르 선택으로 돌아가기
            </Link>
          </section>
        ) : authGate.accessStatus === 'loading' ? (
          <MatchingDetailSkeleton />
        ) : !canAccessPage ? (
          <AuthGateStatusPanel
            title="로그인 후 매칭을 진행할 수 있어요."
            description="로그인하면 장르를 고르고 트레일러를 보며 별점을 남긴 뒤, 취향에 맞는 추천 결과까지 바로 이어서 확인할 수 있어요."
            className="mx-auto max-w-190 sm:py-12"
            align="center"
          />
        ) : matchCandidatesQuery.isLoading ? (
          <MatchingDetailSkeleton />
        ) : matchCandidatesQuery.error ? (
          <section className="survey-panel mx-auto max-w-190 px-6 py-10 sm:px-8 sm:py-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#ff8c8c] uppercase">
              Matching
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              매칭 후보를 불러오지 못했어요.
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
              {getMatchCandidatesErrorMessage(matchCandidatesQuery.error)}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void matchCandidatesQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                다시 시도
              </button>
              <Link
                to={`/${ROUTES.MATCHING_LIST}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                <ChevronLeft size={16} />
                장르 선택으로 돌아가기
              </Link>
            </div>
          </section>
        ) : candidates.length === 0 ? (
          <section className="survey-panel mx-auto max-w-190 px-6 py-10 sm:px-8 sm:py-12">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              이 장르에 준비된 후보 게임이 아직 없어요.
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-7 break-keep text-white/60 sm:text-base">
              잠시 후 다시 시도하거나 다른 장르에서 먼저 매칭을 진행해보세요.
            </p>
            <Link
              to={`/${ROUTES.MATCHING_LIST}`}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
            >
              <ChevronLeft size={16} />
              다른 장르 보기
            </Link>
          </section>
        ) : (
          <>
            <div className="pointer-events-none absolute top-[5.15rem] left-1/2 z-20 w-screen -translate-x-1/2 pr-[clamp(1rem,5vw,20rem)] pl-[clamp(0.35rem,3vw,20rem)] sm:top-[5.45rem] md:top-[5.75rem]">
              <Link
                to={`/${ROUTES.MATCHING_LIST}`}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                <ChevronLeft size={16} />
                다른 장르 보기
              </Link>
            </div>

            <section className="mx-auto mt-9 max-w-255 sm:mt-10 md:mt-12">
              <div className="text-center">
                <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
                  {safeIndex + 1} / {totalSteps} 단계
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[40px]">
                  매칭 과정을 따라가세요
                </h1>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[1.32fr_0.92fr] lg:gap-5 xl:mt-9">
                {currentCandidate ? (
                  <MatchingMediaPanel candidate={currentCandidate} />
                ) : null}

                {currentCandidate && currentEvaluation ? (
                  <article className="survey-panel flex flex-col px-5 py-5 sm:px-6 sm:py-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-semibold tracking-[-0.02em] break-keep text-white sm:text-[30px]">
                          {currentCandidate.title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 break-keep text-white/62">
                          {currentCandidateSummary}
                        </p>
                        <div className="mt-4 grid gap-1.5 border-t border-white/8 pt-2.5 sm:grid-cols-2">
                          <div className="flex h-full flex-col rounded-[14px] border border-white/8 bg-white/3 px-2.5 py-2">
                            <p className="text-[10px] font-medium text-white/38">
                              장르
                            </p>
                            <p className="mt-1 text-[13px] leading-5 font-medium break-keep text-white/78">
                              {currentCandidate.genres.join(' · ') ||
                                genreTitle}
                            </p>
                          </div>
                          <div className="flex h-full flex-col rounded-[14px] border border-white/8 bg-white/3 px-2.5 py-2">
                            <p className="text-[10px] font-medium text-white/38">
                              평균 평점
                            </p>
                            <p className="mt-1 text-[13px] leading-5 font-medium text-white/78">
                              {formatMatchingCandidateRating(
                                currentCandidate.rating,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          likeMutation.mutate({
                            candidate: currentCandidate,
                            nextIsLiked: !currentCandidate.is_liked,
                          })
                        }
                        aria-pressed={currentCandidate.is_liked}
                        aria-label={
                          currentCandidate.is_liked
                            ? '좋아요 해제'
                            : '좋아요 추가'
                        }
                        disabled={likeMutation.isPending}
                        className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d93737] disabled:cursor-not-allowed disabled:opacity-60 ${
                          currentCandidate.is_liked
                            ? 'border-[#c12626]/70 bg-[#220b0b] text-[#f25a5a]'
                            : 'border-white/10 bg-white/3 text-white/54 hover:border-white/20 hover:text-white/80'
                        }`}
                      >
                        <Heart
                          size={20}
                          fill={
                            currentCandidate.is_liked ? 'currentColor' : 'none'
                          }
                        />
                      </button>
                    </div>

                    <div className="mt-7">
                      <p className="text-sm font-semibold text-white">
                        이 게임이 내 취향에 얼마나 가까운가요?
                      </p>
                      <div className="mt-3">
                        <MatchingRatingStars
                          value={currentEvaluation.rating}
                          onRate={(rating) =>
                            setRating(currentCandidate.game_id, rating)
                          }
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 break-keep text-white/54">
                      {isLastCard
                        ? '별점을 매기면 제출 버튼을 사용할 수 있어요.'
                        : '별점을 매기면 다음 게임으로 넘어갈 수 있어요.'}
                    </p>

                    {submitErrorMessage ? (
                      <p className="mt-2.5 text-sm leading-6 break-keep text-[#ffc2c2]">
                        {submitErrorMessage}
                      </p>
                    ) : null}

                    {likeFeedbackMessage ? (
                      <p className="mt-2.5 text-sm leading-6 break-keep text-[#ffc2c2]">
                        {likeFeedbackMessage}
                      </p>
                    ) : null}

                    {isLastCard ? (
                      <div className="mt-auto pt-5">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <button
                            type="button"
                            onClick={goPrevious}
                            disabled={!canGoPrevious}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/2 disabled:text-white/28"
                          >
                            <ChevronLeft size={16} />
                            이전
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={
                              !allCandidatesRated ||
                              submitMatchResponsesMutation.isPending ||
                              likeMutation.isPending
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
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                        <button
                          type="button"
                          onClick={goPrevious}
                          disabled={!canGoPrevious}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/2 disabled:text-white/28"
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
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default MatchingGenreDetailPage;
