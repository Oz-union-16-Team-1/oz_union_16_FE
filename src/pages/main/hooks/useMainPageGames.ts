import { useEffect, useMemo, useState } from 'react';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { shouldRetryApiQuery } from '../../../api/queryRetry';
import { primeGameDetailCacheFromList } from '../../../features/games/detailCachePriming';
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

const getMainGamesErrorMessage = (error: unknown, isSearchMode: boolean) => {
  const subject = isSearchMode ? '검색 결과' : '인기 게임 목록';

  if (error instanceof AxiosError) {
    if (!error.response) {
      return `${subject} 서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.`;
    }

    const data = error.response.data as
      | { detail?: string; error_detail?: string }
      | undefined;

    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (typeof data?.error_detail === 'string') {
      return data.error_detail;
    }
  }

  return `${subject}을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`;
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
