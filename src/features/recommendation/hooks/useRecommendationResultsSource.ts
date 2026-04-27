import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router';

import { getPaginatedResults } from '../../../utils/paginatedResults';
import { useMatchResultsInfinite } from '../../matching/api/useMatchingApi';
import type { MatchResultResponse } from '../../matching/types';
import { useSurveyStore } from '../../survey/store/useSurveyStore';
import { useSurveyResultsInfinite } from '../../survey/api/useSurveyApi';
import { extractApiErrorMessage } from '../../survey/api/survey';
import type { SurveyResultResponse } from '../../survey/types/survey';
import {
  getRecommendationHighlights,
  normalizeRecommendationItem,
} from '../utils/normalizeRecommendationItem';

type UseRecommendationResultsSourceParams = {
  canAccessPage: boolean;
};

export const useRecommendationResultsSource = ({
  canAccessPage,
}: UseRecommendationResultsSourceParams) => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const source = searchParams.get('source');
  const surveySessionIdFromUrl = searchParams.get('session_id');
  const storedSurveySessionId = useSurveyStore((state) => state.sessionId);
  const isMatchSource = source === 'match';
  const isSurveySource =
    source === 'survey' || (!source && Boolean(surveySessionIdFromUrl));
  const resolvedSurveySessionId =
    surveySessionIdFromUrl ?? storedSurveySessionId;

  const surveyResultsQuery = useSurveyResultsInfinite(
    !isMatchSource && isSurveySource && canAccessPage,
    resolvedSurveySessionId,
  );
  const matchResultsQuery = useMatchResultsInfinite(
    isMatchSource && canAccessPage,
  );
  const activeQuery = isMatchSource ? matchResultsQuery : surveyResultsQuery;
  const { error, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    activeQuery;

  const surveyItems =
    surveyResultsQuery.data?.pages.flatMap((page) =>
      getPaginatedResults(page),
    ) ?? [];
  const matchItems =
    matchResultsQuery.data?.pages.flatMap((page) =>
      getPaginatedResults(page),
    ) ?? [];
  const recommendationItems = (isMatchSource ? matchItems : surveyItems).map(
    normalizeRecommendationItem,
  );
  const recommendationHighlights =
    getRecommendationHighlights(recommendationItems);
  const isResultNotFound =
    error instanceof AxiosError && error.response?.status === 404;
  const errorMessage =
    error && !isResultNotFound ? extractApiErrorMessage(error) : null;
  const emptyStateMessage =
    isResultNotFound && isMatchSource
      ? '매칭 추천 결과가 아직 없습니다. 먼저 매칭 평가를 완료해 주세요.'
      : isResultNotFound && isSurveySource
        ? '설문 추천 결과가 아직 준비되지 않았습니다. 설문을 먼저 완료해 주세요.'
        : isMatchSource
          ? '매칭 추천 결과가 아직 없습니다.'
          : '추천 결과가 아직 없습니다.';
  const shouldShowMatchEntryCta =
    isMatchSource &&
    !isLoading &&
    (isResultNotFound || recommendationItems.length === 0);

  useLayoutEffect(() => {
    if (!canAccessPage) {
      return;
    }

    if (isMatchSource) {
      queryClient.setQueryData<{
        pages: MatchResultResponse[];
        pageParams: unknown[];
      }>(['match-results'], (currentData) =>
        currentData
          ? {
              ...currentData,
              pages: currentData.pages.slice(0, 1),
              pageParams: currentData.pageParams.slice(0, 1),
            }
          : currentData,
      );

      return;
    }

    if (isSurveySource) {
      queryClient.setQueriesData<{
        pages: SurveyResultResponse[];
        pageParams: unknown[];
      }>({ queryKey: ['survey-results'] }, (currentData) =>
        currentData
          ? {
              ...currentData,
              pages: currentData.pages.slice(0, 1),
              pageParams: currentData.pageParams.slice(0, 1),
            }
          : currentData,
      );
    }
  }, [canAccessPage, isMatchSource, isSurveySource, queryClient]);

  return {
    isMatchSource,
    isSurveySource,
    recommendationItems,
    recommendationHighlights,
    errorMessage,
    emptyStateMessage,
    isResultNotFound,
    shouldShowMatchEntryCta,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  };
};
