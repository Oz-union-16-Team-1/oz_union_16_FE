import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import useAuthGate from '../../../features/auth/hooks/useAuthGate';
import { likeGame, unlikeGame } from '../../../features/games/gameApi';
import { syncLikeMutationStateInQueryCache } from '../../../features/games/queryCache';
import {
  useMatchCandidatesQuery,
  useSubmitMatchResponsesMutation,
} from '../../../features/matching/api/useMatchingApi';
import {
  getMatchingGenreBySlug,
  isMatchingGenreSlug,
} from '../../../features/matching/genres';
import { useMatchingStore } from '../../../features/matching/store/useMatchingStore';
import type {
  MatchingCandidateItem,
  MatchingEvaluationValue,
  MatchingRatingValue,
} from '../../../features/matching/types';
import {
  getMatchCandidatesErrorMessage,
  getMatchingLikeErrorMessage,
  isCanceledMatchCandidatesError,
} from '../utils/matchingDetail';
import { extractApiErrorMessage } from '../../../features/survey/api/survey';

export type MatchingGenreDetailViewState =
  | 'loading'
  | 'unauthorized'
  | 'invalid'
  | 'error'
  | 'empty'
  | 'ready';

export interface MatchingGenreDetailPageModel {
  viewState: MatchingGenreDetailViewState;
  redirectToLoginState: {
    noticeMessage: string;
    redirectTo: string;
  };
  currentStep: number;
  totalSteps: number;
  currentCandidate: MatchingCandidateItem | null;
  currentEvaluation: MatchingEvaluationValue | null;
  currentCandidateSummary: string;
  genreTitle: string;
  isLastCard: boolean;
  hasSelectedRating: boolean;
  canGoPrevious: boolean;
  allCandidatesRated: boolean;
  likeFeedbackMessage: string | null;
  submitErrorMessage: string | null;
  matchCandidatesErrorMessage: string | null;
  isLikePending: boolean;
  isSubmitPending: boolean;
  onRate: (rating: MatchingRatingValue) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => Promise<void>;
  onRetry: () => void;
  onToggleLike: () => void;
}

export const useMatchingGenreDetailPage = (): MatchingGenreDetailPageModel => {
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
  const candidateSetKey = useMemo(
    () =>
      genre
        ? `${genre.slug}:${candidateRetryNo}:${candidates
            .map((candidate) => candidate.game_id)
            .join(',')}`
        : null,
    [candidateRetryNo, candidates, genre],
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
  }, [candidateSetKey]);

  useEffect(() => {
    if (!genre || candidates.length === 0 || hasInitializedFlowRef.current) {
      return;
    }

    restartFlow(genre, candidates);
    hasInitializedFlowRef.current = true;
    resetSubmitMatchResponsesMutation();
  }, [
    candidateSetKey,
    candidates,
    genre,
    restartFlow,
    resetSubmitMatchResponsesMutation,
  ]);

  const totalSteps = candidates.length;
  const safeIndex =
    totalSteps > 0 ? Math.min(currentIndex, totalSteps - 1) : currentIndex;
  const currentCandidate = candidates[safeIndex] ?? null;
  const currentEvaluation = currentCandidate
    ? (evaluationsByGameId[currentCandidate.game_id] ?? {
        rating: null,
      })
    : null;
  const isLastCard = totalSteps > 0 && safeIndex === totalSteps - 1;
  const hasSelectedRating = currentEvaluation?.rating !== null;
  const canGoPrevious = safeIndex > 0;
  const allCandidatesRated =
    candidates.length > 0 &&
    candidates.every(
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

  const shouldIgnoreMatchCandidatesError = isCanceledMatchCandidatesError(
    matchCandidatesQuery.error,
  );

  const handleSubmit = async () => {
    if (!genre || !allCandidatesRated || candidates.length === 0) {
      return;
    }

    const currentGenreId = genre.genreId;

    try {
      await submitMatchResponsesMutation.mutateAsync({
        genre_id: currentGenreId,
        retry_no: candidateRetryNo,
        match_result: candidates.map((candidate) => ({
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

  const viewState: MatchingGenreDetailViewState = (() => {
    if (authGate.accessStatus === 'unauthorized') {
      return 'unauthorized';
    }

    if (authGate.needsAuthCheck) {
      return 'loading';
    }

    if (!genre || !isValidGenreSlug) {
      return 'invalid';
    }

    if (matchCandidatesQuery.isLoading || shouldIgnoreMatchCandidatesError) {
      return 'loading';
    }

    if (matchCandidatesQuery.error) {
      return 'error';
    }

    if (!currentCandidate || !currentEvaluation || candidates.length === 0) {
      return 'empty';
    }

    return 'ready';
  })();

  return {
    viewState,
    redirectToLoginState: {
      noticeMessage: '로그인 후 매칭을 진행할 수 있어요.',
      redirectTo: `${location.pathname}${location.search}`,
    },
    currentStep: safeIndex + 1,
    totalSteps,
    currentCandidate,
    currentEvaluation,
    currentCandidateSummary,
    genreTitle,
    isLastCard,
    hasSelectedRating,
    canGoPrevious,
    allCandidatesRated,
    likeFeedbackMessage,
    submitErrorMessage,
    matchCandidatesErrorMessage: matchCandidatesQuery.error
      ? getMatchCandidatesErrorMessage(matchCandidatesQuery.error)
      : null,
    isLikePending: likeMutation.isPending,
    isSubmitPending: submitMatchResponsesMutation.isPending,
    onRate: (rating) => {
      if (currentCandidate) {
        setRating(currentCandidate.game_id, rating);
      }
    },
    onPrevious: goPrevious,
    onNext: goNext,
    onSubmit: handleSubmit,
    onRetry: () => {
      void matchCandidatesQuery.refetch();
    },
    onToggleLike: () => {
      if (!currentCandidate) {
        return;
      }

      likeMutation.mutate({
        candidate: currentCandidate,
        nextIsLiked: !currentCandidate.is_liked,
      });
    },
  };
};
