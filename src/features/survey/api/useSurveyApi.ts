import { useInfiniteQuery, useMutation } from '@tanstack/react-query';

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
      const loadedCount = allPages.reduce(
        (count, page) => count + page.results.length,
        0,
      );

      if (loadedCount >= 15) {
        return undefined;
      }

      return lastPage.next;
    },
  });
