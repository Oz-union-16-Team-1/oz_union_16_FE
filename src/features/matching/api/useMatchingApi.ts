import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
} from '@tanstack/react-query';

import { shouldRetryApiQuery } from '../../../api/queryRetry';
import { getPaginatedNext } from '../../../utils/paginatedResults';
import {
  getMatchCandidates,
  getMatchingGenreImage,
  getMatchResponseResults,
  submitMatchResponses,
} from './matching';

export const useMatchCandidatesQuery = (
  genreId: number | null,
  retryNo?: number,
  enabled = true,
) =>
  useQuery({
    queryKey: ['match-candidates', genreId, retryNo ?? 'server'],
    enabled: genreId !== null && enabled,
    queryFn: () => getMatchCandidates(genreId!, retryNo),
    staleTime: 60_000,
    retry: shouldRetryApiQuery,
  });

export const useMatchingGenreImageQuery = (
  genreId: number | null,
  enabled = true,
) =>
  useQuery({
    queryKey: ['match-genre-image', genreId],
    enabled: genreId !== null && enabled,
    queryFn: () => getMatchingGenreImage(genreId!),
    staleTime: 5 * 60_000,
  });

export const useMatchingGenreImageQueries = (
  genreIds: number[],
  enabled = true,
) =>
  useQueries({
    queries: genreIds.map((genreId) => ({
      queryKey: ['match-genre-image', genreId],
      queryFn: () => getMatchingGenreImage(genreId),
      enabled,
      staleTime: 5 * 60_000,
    })),
  });

export const useSubmitMatchResponsesMutation = () =>
  useMutation({
    mutationFn: submitMatchResponses,
  });

export const useMatchResultsInfinite = (
  genreId: number | null,
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: ['match-results', genreId],
    initialPageParam: null as string | null,
    enabled: enabled && genreId !== null,
    queryFn: ({ pageParam }) =>
      getMatchResponseResults({
        genre_id: genreId!,
        cursor: pageParam ?? undefined,
        page_size: 5,
      }),
    getNextPageParam: (lastPage) => getPaginatedNext(lastPage) ?? undefined,
    retry: shouldRetryApiQuery,
  });
