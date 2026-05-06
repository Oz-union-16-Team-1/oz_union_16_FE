import { useCallback, useEffect, useRef } from 'react';

import type { GameListItem } from '../../../features/games/types';
import type { RecommendationDisplayItem } from '../../../features/recommendation/types';
import { toGameListItem } from '../../../features/recommendation/utils/normalizeRecommendationItem';

const LOAD_MORE_SCROLL_STEP_FALLBACK = 124;

type UseRecommendationScrollRestorationParams = {
  itemCount: number;
  fetchNextPage: () => Promise<unknown>;
  setSelectedGame: (game: GameListItem | null) => void;
};

export const useRecommendationScrollRestoration = ({
  itemCount,
  fetchNextPage,
  setSelectedGame,
}: UseRecommendationScrollRestorationParams) => {
  const recommendationScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreScrollTopRef = useRef<number | null>(null);
  const loadMoreWindowScrollYRef = useRef<number | null>(null);
  const loadMoreStepOffsetRef = useRef<number>(LOAD_MORE_SCROLL_STEP_FALLBACK);
  const detailListScrollTopRef = useRef<number | null>(null);
  const detailWindowScrollYRef = useRef<number>(0);

  useEffect(() => {
    if (loadMoreScrollTopRef.current === null) {
      return;
    }

    const scrollContainer = recommendationScrollRef.current;

    if (!scrollContainer) {
      loadMoreScrollTopRef.current = null;
      loadMoreWindowScrollYRef.current = null;
      return;
    }

    window.requestAnimationFrame(() => {
      if (
        typeof window !== 'undefined' &&
        loadMoreWindowScrollYRef.current !== null
      ) {
        window.scrollTo({
          top: loadMoreWindowScrollYRef.current,
          behavior: 'auto',
        });
      }

      scrollContainer.scrollTop =
        (loadMoreScrollTopRef.current ?? scrollContainer.scrollTop) +
        loadMoreStepOffsetRef.current;
      loadMoreScrollTopRef.current = null;
      loadMoreWindowScrollYRef.current = null;
      loadMoreStepOffsetRef.current = LOAD_MORE_SCROLL_STEP_FALLBACK;
    });
  }, [itemCount]);

  const handleOpenDetail = useCallback(
    (item: RecommendationDisplayItem) => {
      detailListScrollTopRef.current =
        recommendationScrollRef.current?.scrollTop ?? null;
      detailWindowScrollYRef.current =
        typeof window !== 'undefined' ? window.scrollY : 0;
      setSelectedGame(toGameListItem(item));
    },
    [setSelectedGame],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedGame(null);

    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: detailWindowScrollYRef.current,
        behavior: 'auto',
      });

      if (
        recommendationScrollRef.current &&
        detailListScrollTopRef.current !== null
      ) {
        recommendationScrollRef.current.scrollTop =
          detailListScrollTopRef.current;
      }
    });
  }, [setSelectedGame]);

  const handleLoadMore = useCallback(() => {
    const scrollContainer = recommendationScrollRef.current;

    if (scrollContainer) {
      loadMoreScrollTopRef.current = scrollContainer.scrollTop;
      const firstRow = scrollContainer.querySelector('article');
      loadMoreStepOffsetRef.current =
        firstRow instanceof HTMLElement
          ? Math.max(
              80,
              Math.min(
                Math.round(firstRow.getBoundingClientRect().height * 0.82),
                160,
              ),
            )
          : LOAD_MORE_SCROLL_STEP_FALLBACK;
    }

    loadMoreWindowScrollYRef.current =
      typeof window !== 'undefined' ? window.scrollY : null;

    void fetchNextPage();
  }, [fetchNextPage]);

  return {
    recommendationScrollRef,
    handleOpenDetail,
    handleCloseDetail,
    handleLoadMore,
  };
};
