import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getTopGames, searchGames } from '../../../features/games/gameApi';
import type { GameGenreFilter } from '../../../features/games/genres';
import { useDebouncedValue } from '../../../features/games/hooks/useDebouncedValue';
import { gamesKeys } from '../../../features/games/queryCache';
import { normalizeSearchText } from '../../../features/games/search';
import type { GameListItem } from '../../../features/games/types';
import {
  getPaginatedCount,
  getPaginatedLoadedCount,
  getPaginatedResults,
} from '../../../utils/paginatedResults';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULT_PAGE_SIZE = 20;

export type MainPageGamesState = {
  searchText: string;
  selectedGenre: GameGenreFilter;
  sectionTitle: string;
  carouselKey: string;
  games: GameListItem[];
  isGamesLoading: boolean;
  isGamesUpdating: boolean;
  isFiltered: boolean;
  hasMoreSearchResults: boolean;
  isFetchingMoreSearchResults: boolean;
  setSearchText: (value: string) => void;
  setSelectedGenre: (genre: GameGenreFilter) => void;
  fetchMoreSearchResults: () => void;
};

export const useMainPageGames = (): MainPageGamesState => {
  const [searchText, setSearchText] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GameGenreFilter>('전체');
  const debouncedSearchText = useDebouncedValue(
    normalizeSearchText(searchText),
    SEARCH_DEBOUNCE_MS,
  );
  const isSearchMode = debouncedSearchText.length > 0;

  const topGamesQuery = useQuery({
    queryKey: gamesKeys.top100(selectedGenre),
    enabled: !isSearchMode,
    queryFn: () => getTopGames({ genre: selectedGenre }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
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
      const loadedCount = getPaginatedLoadedCount(allPages);
      const totalCount = getPaginatedCount(lastPage, loadedCount);

      if (loadedCount >= totalCount) {
        return undefined;
      }

      return allPages.length + 1;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const games = isSearchMode
    ? (searchGamesQuery.data?.pages.flatMap((page) =>
        getPaginatedResults(page),
      ) ?? [])
    : (topGamesQuery.data ?? []);
  const isGamesLoading = isSearchMode
    ? searchGamesQuery.isLoading
    : topGamesQuery.isLoading;
  const isGamesUpdating = isSearchMode
    ? searchGamesQuery.isFetching &&
      !searchGamesQuery.isLoading &&
      !searchGamesQuery.isFetchingNextPage
    : topGamesQuery.isFetching;
  const hasMoreSearchResults = isSearchMode
    ? Boolean(
        searchGamesQuery.hasNextPage || searchGamesQuery.isFetchingNextPage,
      )
    : false;
  const sectionTitle = isSearchMode
    ? `"${debouncedSearchText}" 검색 결과`
    : '인기 TOP 100 🔥';

  return {
    searchText,
    selectedGenre,
    sectionTitle,
    carouselKey: `${debouncedSearchText}-${selectedGenre}`,
    games,
    isGamesLoading,
    isGamesUpdating,
    isFiltered: isSearchMode || selectedGenre !== '전체',
    hasMoreSearchResults,
    isFetchingMoreSearchResults: searchGamesQuery.isFetchingNextPage,
    setSearchText,
    setSelectedGenre,
    fetchMoreSearchResults: () => {
      if (!isSearchMode) {
        return;
      }

      void searchGamesQuery.fetchNextPage();
    },
  };
};
