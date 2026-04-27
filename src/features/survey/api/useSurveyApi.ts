import { useInfiniteQuery, useMutation } from '@tanstack/react-query';

import { shouldRetryApiQuery } from '../../../api/queryRetry';
import {
  getPaginatedCount,
  getPaginatedLoadedCount,
  getPaginatedNext,
} from '../../../utils/paginatedResults';
import {
  continueSurveyChat,
  getSurveyResults,
  resetSurveySession,
  startSurveySession,
} from './survey';

export const useStartSurveySessionMutation = () =>
  useMutation({
    mutationFn: startSurveySession,
  });

export const useContinueSurveyMutation = () =>
  useMutation({
    mutationFn: continueSurveyChat,
  });

export const useResetSurveyMutation = () =>
  useMutation({
    mutationFn: resetSurveySession,
  });

export const useSurveyResultsInfinite = (enabled = true) =>
  useInfiniteQuery({
    queryKey: ['survey-results'],
    initialPageParam: null as string | null,
    enabled,
    queryFn: ({ pageParam }) =>
      getSurveyResults({
        cursor: pageParam ?? undefined,
        page_size: 5,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = getPaginatedLoadedCount(allPages);
      const totalCount = getPaginatedCount(lastPage, 15);

      if (loadedCount >= totalCount) {
        return undefined;
      }

      return getPaginatedNext(lastPage);
    },
    retry: shouldRetryApiQuery,
  });
