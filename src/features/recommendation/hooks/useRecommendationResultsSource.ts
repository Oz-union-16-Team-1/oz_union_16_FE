import { AxiosError } from 'axios';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getPaginatedResults } from '../../../utils/paginatedResults';
import { useMatchResultsInfinite } from '../../matching/api/useMatchingApi';
import { useMatchingStore } from '../../matching/store/useMatchingStore';
import { useSurveyResultsInfinite } from '../../survey/api/useSurveyApi';
import { extractApiErrorMessage } from '../../survey/api/survey';
import { useSurveyStore } from '../../survey/store/useSurveyStore';
import type { RecommendationDisplayItem } from '../types';

type UseRecommendationResultsSourceParams = {
  canAccessPage: boolean;
};

const isRecommendationUnavailableError = (
  error: unknown,
  isSurveySource: boolean,
) => {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const status = error.response?.status;

  return isSurveySource ? status === 404 || status === 409 : status === 404;
};

const getRecommendationEmptyStateMessage = ({
  isMatchSource,
  isSurveySource,
  isResultNotFound,
}: {
  isMatchSource: boolean;
  isSurveySource: boolean;
  isResultNotFound: boolean;
}) => {
  if (isMatchSource && isResultNotFound) {
    return '매칭 추천 결과가 아직 없습니다. 먼저 매칭 평가를 완료해 주세요.';
  }

  if (isSurveySource && isResultNotFound) {
    return '설문 추천 결과가 아직 준비되지 않았습니다. 설문을 먼저 완료해 주세요.';
  }

  return isMatchSource
    ? '매칭 추천 결과가 아직 없습니다.'
    : '추천 결과가 아직 없습니다.';
};

export const useRecommendationResultsSource = ({
  canAccessPage,
}: UseRecommendationResultsSourceParams) => {
  const [searchParams] = useSearchParams();
  const storedSurveySessionId = useSurveyStore((state) => state.sessionId);
  const selectedGenreId = useMatchingStore((state) => state.selectedGenreId);
  const source = searchParams.get('source');
  const matchGenreIdParam = searchParams.get('genre_id');
  const surveySessionIdParam = searchParams.get('session_id');
  const isMatchSource = source === 'match';
  const isSurveySource =
    source === 'survey' || (!source && Boolean(surveySessionIdParam));
  const matchGenreId = matchGenreIdParam ? Number(matchGenreIdParam) : null;
  const resolvedMatchGenreId =
    typeof matchGenreId === 'number' &&
    !Number.isNaN(matchGenreId) &&
    matchGenreId >= 1
      ? matchGenreId
      : selectedGenreId;
  const resolvedSurveySessionId = surveySessionIdParam ?? storedSurveySessionId;

  const surveyResultsQuery = useSurveyResultsInfinite(
    canAccessPage && isSurveySource && !isMatchSource,
    resolvedSurveySessionId,
  );
  const matchResultsQuery = useMatchResultsInfinite(
    resolvedMatchGenreId,
    canAccessPage && isMatchSource,
  );
  const activeQuery = isMatchSource ? matchResultsQuery : surveyResultsQuery;
  const recommendationItems = useMemo<RecommendationDisplayItem[]>(() => {
    const pages = isMatchSource
      ? matchResultsQuery.data?.pages
      : surveyResultsQuery.data?.pages;

    return pages?.flatMap((page) => getPaginatedResults(page)) ?? [];
  }, [
    isMatchSource,
    matchResultsQuery.data?.pages,
    surveyResultsQuery.data?.pages,
  ]);
  const isResultNotFound = isRecommendationUnavailableError(
    activeQuery.error,
    isSurveySource,
  );
  const hasBlockingError = Boolean(activeQuery.error && !isResultNotFound);
  const errorMessage = hasBlockingError
    ? extractApiErrorMessage(
        activeQuery.error,
        isSurveySource ? 'recommendations' : 'generic',
      )
    : null;
  const emptyStateMessage = getRecommendationEmptyStateMessage({
    isMatchSource,
    isSurveySource,
    isResultNotFound,
  });

  return {
    isMatchSource,
    isSurveySource,
    recommendationItems,
    errorMessage,
    emptyStateMessage,
    isResultNotFound,
    hasBlockingError,
    shouldShowMatchEntryCta:
      isMatchSource &&
      !activeQuery.isLoading &&
      (isResultNotFound || recommendationItems.length === 0),
    isLoading: activeQuery.isLoading,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    fetchNextPage: activeQuery.fetchNextPage,
    hasNextPage: Boolean(activeQuery.hasNextPage),
  };
};
