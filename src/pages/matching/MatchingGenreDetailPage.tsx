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
import { authKeys } from '../../features/auth/api/queryKeys';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import type { LikedGamesResponse } from '../../features/auth/types/auth';
import { likeGame, unlikeGame } from '../../features/games/gameApi';
import { syncGameLikeStateInQueryCache } from '../../features/games/queryCache';
import type { MatchingCandidateItem } from '../../features/matching/types';
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

const MATCHING_LIKE_LOGIN_REQUIRED_MESSAGE =
  '로그인 후 좋아요를 사용할 수 있어요.';
const MATCHING_LIKE_ERROR_MESSAGE =
  '좋아요 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.';

const formatMatchingCandidateRating = (rating: number | null) => {
  if (typeof rating !== 'number') {
    return 'N/A';
  }

  const normalizedRating = rating <= 5 ? rating * 20 : rating;

  return `${normalizedRating.toFixed(1)}점`;
};

const isLikedGamesResponse = (value: unknown): value is LikedGamesResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Array.isArray((value as Partial<LikedGamesResponse>).results);
};

const getMatchingLikeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError && error.response?.status === 401) {
    return MATCHING_LIKE_LOGIN_REQUIRED_MESSAGE;
  }

  return MATCHING_LIKE_ERROR_MESSAGE;
};

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
    canAccessPage,
  );
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
  }, [genre?.slug]);

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
  const totalGamesLabel = `${totalSteps}개의 게임`;
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
  const updateLikedGamesCache = (
    candidate: MatchingCandidateItem,
    nextIsLiked: boolean,
  ) => {
    queryClient.setQueriesData<LikedGamesResponse>(
      { queryKey: authKeys.likedGames() },
      (current) => {
        if (!isLikedGamesResponse(current)) {
          return current;
        }

        const currentLikedGames = current as LikedGamesResponse;

        if (nextIsLiked) {
          const alreadyExists = currentLikedGames.results.some(
            (likedGame) => likedGame.game_id === candidate.game_id,
          );

          if (alreadyExists) {
            return current;
          }

          return {
            ...currentLikedGames,
            count: currentLikedGames.count + 1,
            results: [
              {
                game_id: candidate.game_id,
                game_title: candidate.title,
                thumbnail_url: candidate.thumbnail_url,
                genres: candidate.genres,
                liked_at: new Date().toISOString(),
              },
              ...currentLikedGames.results,
            ],
          };
        }

        const nextResults = currentLikedGames.results.filter(
          (likedGame) => likedGame.game_id !== candidate.game_id,
        );

        if (nextResults.length === currentLikedGames.results.length) {
          return current;
        }

        return {
          ...currentLikedGames,
          count: Math.max(0, currentLikedGames.count - 1),
          results: nextResults,
        };
      },
    );
  };
  const likeMutation = useMutation({
    mutationFn: ({
      candidate,
      nextIsLiked,
    }: {
      candidate: MatchingCandidateItem;
      nextIsLiked: boolean;
    }) =>
      nextIsLiked ? likeGame(candidate.game_id) : unlikeGame(candidate.game_id),
    onMutate: () => {
      setLikeFeedbackMessage(null);
    },
    onSuccess: (response, variables) => {
      updateLikedGamesCache(variables.candidate, response.isLiked);
      syncGameLikeStateInQueryCache(queryClient, {
        gameId: response.gameId,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
      });
      void queryClient.invalidateQueries({
        queryKey: authKeys.likedGames(),
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
    if (!allCandidatesRated || displayCandidates.length === 0) {
      return;
    }

    try {
      await submitMatchResponsesMutation.mutateAsync({
        match_result: displayCandidates.map((candidate) => ({
          game_id: candidate.game_id,
          rating: evaluationsByGameId[candidate.game_id]!.rating!,
          is_liked: candidate.is_liked,
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
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-280 px-4 pt-21 pb-8 sm:px-6 sm:pt-[5.6rem] sm:pb-10 md:px-8 md:pt-[5.9rem] md:pb-12">
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
          <AuthGateStatusPanel
            title="인증 상태를 확인하는 중입니다."
            description="잠시만 기다려 주세요. 세션 확인 후 매칭 화면을 불러옵니다."
            align="center"
            className="mx-auto max-w-190 sm:py-12"
          />
        ) : !canAccessPage ? (
          <AuthGateStatusPanel
            title="로그인 후 매칭을 진행할 수 있어요."
            description="로그인하면 장르를 고르고 트레일러를 보며 별점을 남긴 뒤, 취향에 맞는 추천 결과까지 바로 이어서 확인할 수 있어요."
            className="mx-auto max-w-190 sm:py-12"
            align="center"
          />
        ) : matchCandidatesQuery.isLoading ? (
          <section className="survey-panel mx-auto max-w-190 px-6 py-10 text-center text-white/68 sm:px-8 sm:py-12">
            매칭 후보 게임을 불러오는 중입니다...
          </section>
        ) : matchCandidatesQuery.error ? (
          <section className="survey-panel mx-auto max-w-190 px-6 py-10 sm:px-8 sm:py-12">
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
            <div className="pointer-events-none absolute top-[4.85rem] left-1/2 z-20 w-screen -translate-x-1/2 pr-[clamp(1rem,5vw,20rem)] pl-[clamp(0.35rem,3vw,20rem)] sm:top-[5.15rem] md:top-[5.35rem]">
              <Link
                to={`/${ROUTES.MATCHING_LIST}`}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm font-medium text-white transition hover:border-[#a31c1c]/60 hover:bg-[#160909]"
              >
                <ChevronLeft size={16} />
                다른 장르 보기
              </Link>
            </div>

            <section className="mx-auto max-w-240">
              <div className="text-center">
                <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
                  {safeIndex + 1} / {totalSteps} 단계
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[40px]">
                  매칭 과정을 따라가세요
                </h1>
                <p className="mt-3 text-sm leading-6 break-keep text-white/58 sm:text-[15px]">
                  트레일러와 분위기를 보며 {totalGamesLabel}에 별점을
                  남겨보세요. 좋아요는 마음에 든 게임을 표시해 두고
                  마이페이지에서 다시 확인할 수 있게 함께 저장돼요.
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
                  <article className="survey-panel flex flex-col px-5 py-5 sm:px-6 sm:py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-[0.2em] text-[#f06b6b] uppercase">
                          Candidate {safeIndex + 1}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] break-keep text-white sm:text-[28px]">
                          {currentCandidate.title}
                        </h2>
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

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-white/46">
                      <span className="rounded-full border border-white/8 bg-white/3 px-3 py-1.5">
                        장르 {currentCandidate.genres.join(' · ')}
                      </span>
                      <span className="rounded-full border border-white/8 bg-white/3 px-3 py-1.5">
                        평균 평점{' '}
                        {formatMatchingCandidateRating(currentCandidate.rating)}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-white">
                        이 게임이 내 취향에 얼마나 가까운가요?
                      </p>
                      <p className="mt-1 text-sm leading-6 break-keep text-white/55">
                        별점은 추천을 더 정교하게 만드는 선호도 평가로 반영돼요.
                      </p>
                      <div className="mt-3.5">
                        <MatchingRatingStars
                          value={currentEvaluation.rating}
                          onRate={(rating) =>
                            setRating(currentCandidate.game_id, rating)
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-5 rounded-[20px] border border-white/8 bg-white/3 px-4 py-3.5">
                      <p className="text-sm leading-7 break-keep text-white/64">
                        {isLastCard
                          ? currentEvaluation.rating === null
                            ? '마지막 후보예요. 별점을 남기면 지금까지의 선호도 평가를 제출하고 추천 결과로 바로 이어갈 수 있어요.'
                            : '모든 선호도 평가가 준비됐어요. 제출하면 취향에 맞는 추천 결과를 바로 확인할 수 있어요.'
                          : currentEvaluation.rating === null
                            ? '트레일러와 분위기를 보고 지금 카드의 별점을 남겨 주세요.'
                            : '별점은 취향 분석에 반영되고, 좋아요는 마이페이지에서 다시 볼 게임을 표시해 두는 용도로 저장돼요.'}
                      </p>
                    </div>

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
