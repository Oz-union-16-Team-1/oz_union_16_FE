import { useQuery } from '@tanstack/react-query';

import { getMatchCandidates } from './matching';

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
