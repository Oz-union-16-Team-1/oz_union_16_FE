import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { shouldRetryApiQuery } from '../../../api/queryRetry';
import { getTopGames, searchGames } from '../../../features/games/gameApi';
import type { GameGenreFilter } from '../../../features/games/genres';
import { gamesKeys } from '../../../features/games/queryCache';
import {
  getPaginatedCount,
  getPaginatedLoadedCount,
} from '../../../utils/paginatedResults';
import { SEARCH_RESULT_PAGE_SIZE } from './mainPageGames.utils';

type UseMainPageGameQueriesParams = {
  selectedGenre: GameGenreFilter;
  debouncedSearchText: string;
  isSearchMode: boolean;
};

export const useMainPageGameQueries = ({
  selectedGenre,
  debouncedSearchText,
  isSearchMode,
}: UseMainPageGameQueriesParams) => {
  const topGamesQuery = useQuery({
    queryKey: gamesKeys.top100(selectedGenre),
    enabled: !isSearchMode,
    queryFn: () => getTopGames({ genre: selectedGenre }),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: shouldRetryApiQuery,
  });

  const searchGamesQuery = useInfiniteQuery({
    queryKey: gamesKeys.search(debouncedSearchText, selectedGenre),
    enabled: isSearchMode,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      searchGames({
        search: debouncedSearchText,
        genre: selectedGenre,
        page: pageParam,
        pageSize: SEARCH_RESULT_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (typeof lastPage.next === 'number') {
        return lastPage.next;
      }

      const loadedCount = getPaginatedLoadedCount(allPages);
      const totalCount = getPaginatedCount(lastPage, loadedCount);

      if (loadedCount >= totalCount) {
        return undefined;
      }

      return allPages.length + 1;
    },
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: shouldRetryApiQuery,
  });

  return {
    topGamesQuery,
    searchGamesQuery,
  };
};
