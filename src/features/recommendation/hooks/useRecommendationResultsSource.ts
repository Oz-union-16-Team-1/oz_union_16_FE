import { useQueryClient } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router';

import { useMatchResultsInfinite } from '../../matching/api/useMatchingApi';
import type { MatchResultResponse } from '../../matching/types';
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
  const legacySessionId = searchParams.get('session_id');
  const isMatchSource = source === 'match';
  const isSurveySource =
    source === 'survey' || (!source && Boolean(legacySessionId));

  const surveyResultsQuery = useSurveyResultsInfinite(
    !isMatchSource && isSurveySource && canAccessPage,
  );
  const matchResultsQuery = useMatchResultsInfinite(
    isMatchSource && canAccessPage,
  );
  const activeQuery = isMatchSource ? matchResultsQuery : surveyResultsQuery;
  const { error, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    activeQuery;

  const surveyItems =
    surveyResultsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const matchItems =
    matchResultsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const recommendationItems = (isMatchSource ? matchItems : surveyItems).map(
    normalizeRecommendationItem,
  );
  const recommendationHighlights =
    getRecommendationHighlights(recommendationItems);
  const errorMessage = error ? extractApiErrorMessage(error) : null;
  const shouldShowMatchEntryCta =
    isMatchSource &&
    !isLoading &&
    Boolean(
      errorMessage?.includes('매칭 추천 결과를 찾을 수 없습니다') ||
      recommendationItems.length === 0,
    );

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
      queryClient.setQueryData<{
        pages: SurveyResultResponse[];
        pageParams: unknown[];
      }>(['survey-results'], (currentData) =>
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
    shouldShowMatchEntryCta,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  };
};
