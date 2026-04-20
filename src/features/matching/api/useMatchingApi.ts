import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import {
  getMatchCandidates,
  getMatchResponseResults,
  submitMatchResponses,
} from './matching';

export const useMatchCandidatesQuery = (
  genreId: number | null,
  enabled = true,
) =>
  useQuery({
    queryKey: ['match-candidates', genreId],
    enabled: genreId !== null && enabled,
    queryFn: () => getMatchCandidates(genreId!),
    staleTime: 60_000,
  });

export const useSubmitMatchResponsesMutation = () =>
  useMutation({
    mutationFn: submitMatchResponses,
  });

export const useMatchResultsInfinite = (enabled = true) =>
  useInfiniteQuery({
    queryKey: ['match-results'],
    initialPageParam: null as string | null,
    enabled,
    queryFn: ({ pageParam }) =>
      getMatchResponseResults({
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
