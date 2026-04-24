import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ChevronDown, ChevronRight, Heart, Star } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import AuthGateStatusPanel from '../../components/auth/AuthGateStatusPanel';
import ActionButton from '../../components/common/ActionButton';
import LazyHeader from '../../components/common/LazyHeader';
import { ROUTES } from '../../constants/routes';
import { authKeys } from '../../features/auth/api/queryKeys';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import type { LikedGamesResponse } from '../../features/auth/types/auth';
import GameDetailModal from '../../features/games/components/GameDetailModal';
import {
  getGameDetail,
  likeGame,
  unlikeGame,
} from '../../features/games/gameApi';
import {
  gamesKeys,
  syncGameLikeStateInQueryCache,
} from '../../features/games/queryCache';
import type { GameListItem } from '../../features/games/types';
import { useMatchResultsInfinite } from '../../features/matching/api/useMatchingApi';
import type {
  MatchResultItem,
  MatchResultResponse,
} from '../../features/matching/types';
import { useSurveyResultsInfinite } from '../../features/survey/api/useSurveyApi';
import { extractApiErrorMessage } from '../../features/survey/api/survey';
import type {
  SurveyResultItem,
  SurveyResultResponse,
} from '../../features/survey/types/survey';

const FALLBACK_BACKDROP_ITEMS = [
  {
    id: 'fallback-1',
    title: '추천 준비 중',
    thumbnail:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fallback-2',
    title: '추천 준비 중',
    thumbnail:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fallback-3',
    title: '추천 준비 중',
    thumbnail:
      'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fallback-4',
    title: '추천 준비 중',
    thumbnail:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&q=80',
  },
];

const FALLBACK_HIGHLIGHTS = ['몰입감', '스토리', '액션', '전략'];

type RecommendationDisplayItem = {
  game_id: number;
  title: string;
  genres: string[];
  thumbnail_url: string | null;
  rating: number | null;
  is_liked: boolean;
};

type RecommendationLikeMutationVariables = {
  gameId: number;
  nextIsLiked: boolean;
  item: RecommendationDisplayItem;
};

const LIKE_ERROR_MESSAGE =
  '좋아요 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const LIKE_LOGIN_REQUIRED_MESSAGE = '로그인 후 좋아요를 사용할 수 있어요.';
const FEEDBACK_MESSAGE_DURATION_MS = 3000;
const LOAD_MORE_SCROLL_STEP_FALLBACK = 124;

const isLikedGamesResponse = (value: unknown): value is LikedGamesResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Array.isArray((value as Partial<LikedGamesResponse>).results);
};

const normalizeResultItem = (
  item: SurveyResultItem | MatchResultItem,
): RecommendationDisplayItem => ({
  game_id: item.game_id,
  title: item.title,
  genres: item.genres,
  thumbnail_url: item.thumbnail_url,
  rating: item.rating,
  is_liked: item.is_liked,
});

const toGameListItem = (item: RecommendationDisplayItem): GameListItem => ({
  gameId: item.game_id,
  name: item.title,
  genres: item.genres,
  thumbnailUrl: item.thumbnail_url,
  rating: item.rating,
  isLiked: item.is_liked,
});

const formatRecommendationRating = (rating: number | null) =>
  typeof rating === 'number' ? `${rating.toFixed(1)}점` : 'N/A';

const getRecommendationHighlights = (items: RecommendationDisplayItem[]) => {
  const genreCounts = new Map<string, number>();

  items.forEach((item) => {
    item.genres.forEach((genre) => {
      const trimmedGenre = genre.trim();

      if (!trimmedGenre) {
        return;
      }

      genreCounts.set(trimmedGenre, (genreCounts.get(trimmedGenre) ?? 0) + 1);
    });
  });

  const rankedGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre]) => genre);

  return rankedGenres.length > 0 ? rankedGenres : FALLBACK_HIGHLIGHTS;
};

type RecommendationRowProps = {
  item: RecommendationDisplayItem;
  onOpenDetail: (item: RecommendationDisplayItem) => void;
  onToggleLike: (item: RecommendationDisplayItem) => void;
  isLikePending: boolean;
};

function RecommendationRow({
  item,
  onOpenDetail,
  onToggleLike,
  isLikePending,
}: RecommendationRowProps) {
  return (
    <article className="group grid gap-4 px-4 py-5 transition-colors duration-200 hover:bg-white/2.5 sm:grid-cols-[118px_minmax(0,1fr)] sm:items-center sm:px-6 sm:py-6 lg:grid-cols-[118px_minmax(0,1fr)_auto] lg:gap-6 lg:px-7">
      <button
        type="button"
        onClick={() => onOpenDetail(item)}
        aria-label={`${item.title} 상세 보기`}
        className="bg-auth-panel overflow-hidden rounded-[20px] border border-white/6 text-left shadow-[0_14px_32px_rgba(0,0,0,0.18)] transition hover:border-white/12 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]"
      >
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="h-23.5 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-22"
          />
        ) : (
          <div className="flex h-23.5 w-full items-center justify-center bg-[#151515] text-sm text-white/35 sm:h-22">
            이미지 준비 중
          </div>
        )}
      </button>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="truncate text-[22px] font-semibold tracking-[-0.02em] text-white sm:text-[26px]">
            {item.title}
          </h2>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#702525]/40 bg-[#190a0a]/55 px-2.5 py-1 text-[12px] font-semibold text-white/88">
            <Star size={12} className="fill-[#d85858] text-[#d85858]" />
            {formatRecommendationRating(item.rating)}
          </div>
        </div>

        <p className="mt-2 text-[11px] font-medium tracking-[0.22em] text-white/32 uppercase">
          {item.genres.join(' · ') || '장르 정보 준비 중'}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 lg:min-w-24">
        <ActionButton
          type="button"
          variant="icon"
          onClick={() => onToggleLike(item)}
          disabled={isLikePending}
          className={`${
            item.is_liked
              ? 'border-[#6f2525] bg-[#170b0b] text-[#f07373]'
              : 'border-white/10 bg-white/2 text-white/60 hover:border-white/18 hover:text-white/86'
          } ${isLikePending ? 'cursor-not-allowed opacity-55' : ''}`}
          aria-label={item.is_liked ? '좋아요 해제' : '좋아요 추가'}
        >
          <Heart size={16} fill={item.is_liked ? 'currentColor' : 'none'} />
        </ActionButton>

        <ActionButton
          type="button"
          variant="icon"
          onClick={() => onOpenDetail(item)}
          aria-label={`${item.title} 상세 보기`}
          className="border-transparent text-white/42 group-hover:border-white/8 group-hover:bg-white/3 group-hover:text-white/82"
        >
          <ChevronRight size={18} />
        </ActionButton>
      </div>
    </article>
  );
}

type RecommendationBackdropProps = {
  items: RecommendationDisplayItem[];
};

function RecommendationBackdrop({ items }: RecommendationBackdropProps) {
  const backdropItems =
    items.length > 0
      ? [...items, ...items].slice(0, 12).map((item, index) => ({
          id: `${item.game_id}-${index}`,
          title: item.title,
          thumbnail: item.thumbnail_url,
        }))
      : FALLBACK_BACKDROP_ITEMS;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid h-full grid-cols-4 gap-4 p-4 opacity-[0.14] saturate-0 sm:grid-cols-5 lg:grid-cols-7 lg:gap-6 lg:p-8">
        {backdropItems.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-[20px] border border-white/6 bg-white/2 shadow-[0_18px_34px_rgba(0,0,0,0.18)]"
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center bg-[#161616] text-sm text-white/25">
                PGTI
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,28,28,0.1),transparent_24%),linear-gradient(180deg,rgba(6,6,7,0.72),rgba(6,6,7,0.94))]" />
    </div>
  );
}

function RecommendationListPage() {
  const [searchParams] = useSearchParams();
  const [selectedGame, setSelectedGame] = useState<GameListItem | null>(null);
  const [pendingLikeGameId, setPendingLikeGameId] = useState<number | null>(
    null,
  );
  const [likeFeedbackMessage, setLikeFeedbackMessage] = useState<string | null>(
    null,
  );
  const recommendationScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreScrollTopRef = useRef<number | null>(null);
  const loadMoreWindowScrollYRef = useRef<number | null>(null);
  const loadMoreStepOffsetRef = useRef<number>(LOAD_MORE_SCROLL_STEP_FALLBACK);
  const detailListScrollTopRef = useRef<number | null>(null);
  const detailWindowScrollYRef = useRef<number>(0);
  const queryClient = useQueryClient();
  const source = searchParams.get('source');
  const legacySessionId = searchParams.get('session_id');
  const isMatchSource = source === 'match';
  const isSurveySource =
    source === 'survey' || (!source && Boolean(legacySessionId));
  const authGate = useAuthGate({ allowMockBypass: true });
  const canAccessPage = authGate.accessStatus === 'authorized';

  const surveyResultsQuery = useSurveyResultsInfinite(
    !isMatchSource && isSurveySource && canAccessPage,
  );
  const matchResultsQuery = useMatchResultsInfinite(
    isMatchSource && canAccessPage,
  );
  const activeQuery = isMatchSource ? matchResultsQuery : surveyResultsQuery;
  const { error, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    activeQuery;

  const surveyItems =
    surveyResultsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const matchItems =
    matchResultsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const recommendationItems = (isMatchSource ? matchItems : surveyItems).map(
    normalizeResultItem,
  );
  const recommendationHighlights =
    getRecommendationHighlights(recommendationItems);
  const errorMessage = error ? extractApiErrorMessage(error) : null;
  const shouldShowMatchEntryCta =
    isMatchSource &&
    !isLoading &&
    Boolean(
      errorMessage?.includes('매칭 추천 결과를 찾을 수 없습니다') ||
      recommendationItems.length === 0,
    );

  useLayoutEffect(() => {
    if (!canAccessPage) {
      return;
    }

    if (isMatchSource) {
      queryClient.setQueryData<{
        pages: MatchResultResponse[];
        pageParams: unknown[];
      }>(['match-results'], (currentData) =>
        currentData
          ? {
              ...currentData,
              pages: currentData.pages.slice(0, 1),
              pageParams: currentData.pageParams.slice(0, 1),
            }
          : currentData,
      );

      return;
    }

    if (isSurveySource) {
      queryClient.setQueryData<{
        pages: SurveyResultResponse[];
        pageParams: unknown[];
      }>(['survey-results'], (currentData) =>
        currentData
          ? {
              ...currentData,
              pages: currentData.pages.slice(0, 1),
              pageParams: currentData.pageParams.slice(0, 1),
            }
          : currentData,
      );
    }
  }, [canAccessPage, isMatchSource, isSurveySource, queryClient]);

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
  }, [recommendationItems.length]);

  const handleOpenDetail = (item: RecommendationDisplayItem) => {
    detailListScrollTopRef.current =
      recommendationScrollRef.current?.scrollTop ?? null;
    detailWindowScrollYRef.current =
      typeof window !== 'undefined' ? window.scrollY : 0;
    setSelectedGame(toGameListItem(item));
  };

  const handleCloseDetail = () => {
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
  };

  const handleLoadMore = () => {
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
  };

  useEffect(() => {
    if (!likeFeedbackMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setLikeFeedbackMessage(null);
    }, FEEDBACK_MESSAGE_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [likeFeedbackMessage]);

  const updateLikedGamesCache = (
    item: RecommendationDisplayItem,
    nextIsLiked: boolean,
  ) => {
    queryClient.setQueriesData<LikedGamesResponse>(
      { queryKey: authKeys.likedGames() },
      (current) => {
        if (!isLikedGamesResponse(current)) {
          return current;
        }

        const currentLikedGames = current as LikedGamesResponse;

        if (nextIsLiked) {
          const alreadyExists = currentLikedGames.results.some(
            (likedGame) => likedGame.game_id === item.game_id,
          );

          if (alreadyExists) {
            return current;
          }

          return {
            ...currentLikedGames,
            count: currentLikedGames.count + 1,
            results: [
              {
                game_id: item.game_id,
                game_title: item.title,
                thumbnail_url: item.thumbnail_url,
                genres: item.genres,
                liked_at: new Date().toISOString(),
              },
              ...currentLikedGames.results,
            ],
          };
        }

        const nextResults = currentLikedGames.results.filter(
          (likedGame) => likedGame.game_id !== item.game_id,
        );

        if (nextResults.length === currentLikedGames.results.length) {
          return current;
        }

        return {
          ...currentLikedGames,
          count: Math.max(0, currentLikedGames.count - 1),
          results: nextResults,
        };
      },
    );
  };

  const likeMutation = useMutation({
    mutationFn: ({
      gameId,
      nextIsLiked,
    }: RecommendationLikeMutationVariables) =>
      nextIsLiked ? likeGame(gameId) : unlikeGame(gameId),
    onMutate: ({ gameId }) => {
      setPendingLikeGameId(gameId);
      setLikeFeedbackMessage(null);
    },
    onSuccess: async (response, variables) => {
      updateLikedGamesCache(variables.item, response.isLiked);
      setSelectedGame((current) =>
        current?.gameId === response.gameId
          ? { ...current, isLiked: response.isLiked }
          : current,
      );
      syncGameLikeStateInQueryCache(queryClient, {
        gameId: response.gameId,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
      });

      try {
        const detail = await queryClient.fetchQuery({
          queryKey: gamesKeys.detail(response.gameId),
          queryFn: () => getGameDetail(response.gameId),
          staleTime: 60_000,
        });

        queryClient.setQueriesData<LikedGamesResponse>(
          { queryKey: authKeys.likedGames() },
          (current) => {
            if (!isLikedGamesResponse(current) || !response.isLiked) {
              return current;
            }

            const currentLikedGames = current as LikedGamesResponse;

            return {
              ...currentLikedGames,
              results: currentLikedGames.results.map((likedGame) =>
                likedGame.game_id === response.gameId
                  ? {
                      ...likedGame,
                      game_title: detail.title.trim() || likedGame.game_title,
                      thumbnail_url:
                        detail.coverImageUrl ?? likedGame.thumbnail_url,
                      genres: detail.genres.length
                        ? detail.genres
                        : likedGame.genres,
                    }
                  : likedGame,
              ),
            };
          },
        );
      } catch {
        // 상세 조회 실패는 좋아요 토글 결과를 되돌릴 이유가 아니므로 무시합니다.
      }

      void queryClient.invalidateQueries({
        queryKey: authKeys.likedGames(),
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        setLikeFeedbackMessage(LIKE_LOGIN_REQUIRED_MESSAGE);
        return;
      }

      setLikeFeedbackMessage(LIKE_ERROR_MESSAGE);
    },
    onSettled: () => {
      setPendingLikeGameId(null);
    },
  });

  const handleToggleLike = (item: RecommendationDisplayItem) => {
    likeMutation.mutate({
      gameId: item.game_id,
      nextIsLiked: !item.is_liked,
      item,
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <RecommendationBackdrop items={recommendationItems} />
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-300 flex-col px-3 pt-24 pb-10 sm:px-4 sm:pt-28 sm:pb-12 md:px-8 md:pt-32 md:pb-16">
        <section className="mx-auto w-full max-w-245">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-[52px]">
              게임 추천 리스트
            </h1>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {recommendationHighlights.map((highlight) => (
                <span
                  key={highlight}
                  className="inline-flex items-center rounded-full border border-white/8 bg-white/3 px-3 py-1.5 text-xs font-medium text-white/68 backdrop-blur-sm"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          {authGate.accessStatus === 'loading' ? (
            <AuthGateStatusPanel
              title="인증 상태를 확인하는 중입니다."
              description="잠시만 기다려 주세요. 세션 확인 후 추천 결과를 불러옵니다."
            />
          ) : !canAccessPage ? (
            <AuthGateStatusPanel
              title="로그인 후 추천 결과를 볼 수 있어요."
              description="실제 API 모드에서는 인증 토큰이 필요합니다. 개발 중에는 MSW를 켜두면 추천 결과 흐름을 확인할 수 있습니다."
            />
          ) : !isMatchSource && !isSurveySource ? (
            <section className="survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
              <h2 className="text-2xl font-bold text-white">
                먼저 설문을 완료해 주세요.
              </h2>
              <p className="mt-4 text-base leading-7 break-keep text-white/60">
                설문이 끝나면 추천 결과를 이 페이지에서 바로 확인할 수 있어요.
              </p>
              <Link
                to={`/${ROUTES.SURVEY}`}
                className="mt-6 inline-flex rounded-2xl bg-[linear-gradient(135deg,#ff3535,#9f1212)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
              >
                설문 페이지로 이동
              </Link>
            </section>
          ) : shouldShowMatchEntryCta ? (
            <section className="survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
              <h2 className="text-2xl font-bold text-white">
                먼저 매칭 평가를 완료해 주세요.
              </h2>
              <p className="mt-4 text-base leading-7 break-keep text-white/60">
                좋아하는 장르를 고르고 최대 5개 게임의 트레일러를 보며 별점을
                남기면 추천 결과가 바로 준비돼요.
              </p>
              <Link
                to={`/${ROUTES.MATCHING_LIST}`}
                className="mt-6 inline-flex rounded-2xl bg-[linear-gradient(135deg,#ff3535,#9f1212)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
              >
                매칭 페이지로 이동
              </Link>
            </section>
          ) : (
            <section className="overflow-hidden rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.92),rgba(9,9,10,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
              {likeFeedbackMessage ? (
                <div className="border-b border-white/8 px-4 py-4 sm:px-6 lg:px-7">
                  <p className="text-sm leading-6 break-keep text-[#ffc2c2]">
                    {likeFeedbackMessage}
                  </p>
                </div>
              ) : null}

              {isLoading ? (
                <div className="px-4 py-14 text-center text-white/65 sm:px-6 lg:px-7">
                  추천 결과를 불러오는 중입니다...
                </div>
              ) : error ? (
                <div className="px-4 py-12 text-[#ffc2c2] sm:px-6 lg:px-7">
                  {errorMessage}
                </div>
              ) : recommendationItems.length === 0 ? (
                <div className="px-4 py-12 text-white/55 sm:px-6 lg:px-7">
                  {isMatchSource
                    ? '매칭 추천 결과가 아직 없습니다.'
                    : '추천 결과가 아직 없습니다.'}
                </div>
              ) : (
                <>
                  <div
                    ref={recommendationScrollRef}
                    className="recommendation-scroll max-h-[62vh] overflow-y-auto"
                  >
                    <div className="divide-y divide-white/8">
                      {recommendationItems.map((item) => (
                        <RecommendationRow
                          key={item.game_id}
                          item={item}
                          onOpenDetail={handleOpenDetail}
                          onToggleLike={handleToggleLike}
                          isLikePending={pendingLikeGameId === item.game_id}
                        />
                      ))}
                    </div>
                  </div>

                  {hasNextPage || isFetchingNextPage ? (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                      className="flex w-full flex-col items-center justify-center gap-1.5 border-t border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.03))] px-4 py-4 text-sm font-medium text-white/82 transition hover:bg-white/4 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:px-6 lg:px-7"
                    >
                      <span>
                        {isFetchingNextPage
                          ? '추천 결과를 불러오는 중입니다...'
                          : '더보기'}
                      </span>
                      <div className="flex flex-col items-center gap-0.5">
                        {!isFetchingNextPage ? (
                          <ChevronDown
                            size={18}
                            className="translate-y-px text-white/56"
                          />
                        ) : null}
                        <span className="text-[11px] font-normal tracking-[0.14em] text-white/38 uppercase">
                          {isFetchingNextPage ? 'Loading' : 'More Below'}
                        </span>
                      </div>
                    </button>
                  ) : null}
                </>
              )}
            </section>
          )}
        </section>
      </main>

      {selectedGame ? (
        <GameDetailModal
          key={selectedGame.gameId}
          game={selectedGame}
          onClose={handleCloseDetail}
        />
      ) : null}
    </div>
  );
}

export default RecommendationListPage;
