import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { primeGameDetailCacheFromList } from '../../../features/games/detailCachePriming';
import type { GameGenreFilter } from '../../../features/games/genres';
import { useDebouncedValue } from '../../../features/games/hooks/useDebouncedValue';
import { normalizeSearchText } from '../../../features/games/search';
import type { GameListItem } from '../../../features/games/types';
import { getPaginatedResults } from '../../../utils/paginatedResults';
import {
  getMainGamesErrorMessage,
  SEARCH_DEBOUNCE_MS,
} from './mainPageGames.utils';
import { useMainPageGameQueries } from './useMainPageGameQueries';

export type MainPageGamesState = {
  searchText: string;
  selectedGenre: GameGenreFilter;
  sectionTitle: string;
  carouselKey: string;
  games: GameListItem[];
  isGamesLoading: boolean;
  isGamesError: boolean;
  isGamesUpdating: boolean;
  isFiltered: boolean;
  gamesErrorMessage: string | null;
  hasMoreSearchResults: boolean;
  isFetchingMoreSearchResults: boolean;
  setSearchText: (value: string) => void;
  setSelectedGenre: (genre: GameGenreFilter) => void;
  fetchMoreSearchResults: () => void;
  retryGames: () => void;
};

export const useMainPageGames = (): MainPageGamesState => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GameGenreFilter>('전체');
  const debouncedSearchText = useDebouncedValue(
    normalizeSearchText(searchText),
    SEARCH_DEBOUNCE_MS,
  );
  const isSearchMode = debouncedSearchText.length > 0;

  const { topGamesQuery, searchGamesQuery } = useMainPageGameQueries({
    selectedGenre,
    debouncedSearchText,
    isSearchMode,
  });

  const games = useMemo(
    () =>
      isSearchMode
        ? (searchGamesQuery.data?.pages.flatMap((page) =>
            getPaginatedResults(page),
          ) ?? [])
        : (topGamesQuery.data ?? []),
    [isSearchMode, searchGamesQuery.data?.pages, topGamesQuery.data],
  );
  const isGamesLoading = isSearchMode
    ? searchGamesQuery.isLoading
    : topGamesQuery.isLoading;
  const isGamesError = isSearchMode
    ? searchGamesQuery.isError && games.length === 0
    : topGamesQuery.isError && games.length === 0;
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
  const gamesErrorMessage = isGamesError
    ? getMainGamesErrorMessage(
        isSearchMode ? searchGamesQuery.error : topGamesQuery.error,
        isSearchMode,
      )
    : null;

  useEffect(() => {
    if (games.length === 0) {
      return;
    }

    void primeGameDetailCacheFromList(queryClient, games);
  }, [games, queryClient]);

  return {
    searchText,
    selectedGenre,
    sectionTitle,
    carouselKey: `${debouncedSearchText}-${selectedGenre}`,
    games,
    isGamesLoading,
    isGamesError,
    isGamesUpdating,
    isFiltered: isSearchMode || selectedGenre !== '전체',
    gamesErrorMessage,
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
    retryGames: () => {
      if (isSearchMode) {
        void searchGamesQuery.refetch();
        return;
      }

      void topGamesQuery.refetch();
    },
  };
};
