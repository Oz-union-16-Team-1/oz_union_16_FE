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

export const useMatchResultsInfinite = (
  sort: 'rating_desc' | 'created_at' = 'rating_desc',
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: ['match-results', sort],
    initialPageParam: null as string | null,
    enabled,
    queryFn: ({ pageParam }) =>
      getMatchResponseResults({
        sort,
        cursor: pageParam ?? undefined,
        page_size: 4,
      }),
    getNextPageParam: (lastPage) => lastPage.next,
  });
