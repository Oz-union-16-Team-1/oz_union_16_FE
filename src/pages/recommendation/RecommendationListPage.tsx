import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ChevronDown, ChevronRight, Heart, Sparkles, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import ActionButton from '../../components/common/ActionButton';
import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import { authKeys } from '../../features/auth/api/queryKeys';
import useAuthGuardState from '../../features/auth/hooks/useAuthGuardState';
import type { LikedGamesResponse } from '../../features/auth/types/auth';
import GameDetailModal from '../../features/games/components/GameDetailModal';
import {
  getGameDetail,
  likeGame,
  unlikeGame,
} from '../../features/games/gameApi';
import type { GameDetail } from '../../features/games/types';
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
import { isMockServiceWorkerEnabled } from '../../lib/env';

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
    <article className="group grid gap-4 px-4 py-5 transition-colors duration-200 hover:bg-white/[0.025] sm:grid-cols-[118px_minmax(0,1fr)] sm:items-center sm:px-6 sm:py-6 lg:grid-cols-[118px_minmax(0,1fr)_auto] lg:gap-6 lg:px-7">
      <button
        type="button"
        onClick={() => onOpenDetail(item)}
        aria-label={`${item.title} 상세 보기`}
        className="overflow-hidden rounded-[20px] border border-white/6 bg-[#111111] text-left shadow-[0_14px_32px_rgba(0,0,0,0.18)] transition hover:border-white/12 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]"
      >
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="h-[94px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-[88px]"
          />
        ) : (
          <div className="flex h-[94px] w-full items-center justify-center bg-[#151515] text-sm text-white/35 sm:h-[88px]">
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

      <div className="flex items-center justify-end gap-3 lg:min-w-[96px]">
        <ActionButton
          type="button"
          variant="icon"
          onClick={() => onToggleLike(item)}
          disabled={isLikePending}
          className={`${
            item.is_liked
              ? 'border-[#6f2525] bg-[#170b0b] text-[#f07373]'
              : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/18 hover:text-white/86'
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
          className="border-transparent text-white/42 group-hover:border-white/8 group-hover:bg-white/[0.03] group-hover:text-white/82"
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
            className="overflow-hidden rounded-[20px] border border-white/6 bg-white/[0.02] shadow-[0_18px_34px_rgba(0,0,0,0.18)]"
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[160px] items-center justify-center bg-[#161616] text-sm text-white/25">
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
  const loadMoreAnchorOffsetRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const source = searchParams.get('source');
  const legacySessionId = searchParams.get('session_id');
  const isMatchSource = source === 'match';
  const isSurveySource =
    source === 'survey' || (!source && Boolean(legacySessionId));
  const isMockMode = isMockServiceWorkerEnabled();
  const { canAccessAuthenticatedRoute, isAuthReady } = useAuthGuardState();
  const canAccessPage = isMockMode || canAccessAuthenticatedRoute;

  const surveyResultsQuery = useSurveyResultsInfinite(
    !isMatchSource && isSurveySource && canAccessPage,
  );
  const matchResultsQuery = useMatchResultsInfinite(
    isMatchSource && canAccessPage,
  );
  const activeQuery = isMatchSource ? matchResultsQuery : surveyResultsQuery;
  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = activeQuery;

  const surveyItems =
    surveyResultsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const matchItems =
    matchResultsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const recommendationItems = (isMatchSource ? matchItems : surveyItems).map(
    normalizeResultItem,
  );
  const totalCount = data?.pages[0]?.count ?? 0;
  const visibleResultLimit = 15;
  const cappedTotalCount =
    totalCount > 0
      ? Math.min(totalCount, visibleResultLimit)
      : Math.min(recommendationItems.length, visibleResultLimit);
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

  useEffect(() => {
    if (loadMoreAnchorOffsetRef.current === null) {
      return;
    }

    const scrollContainer = recommendationScrollRef.current;

    if (!scrollContainer) {
      loadMoreAnchorOffsetRef.current = null;
      return;
    }

    const nextScrollTop =
      scrollContainer.scrollHeight - loadMoreAnchorOffsetRef.current;
    scrollContainer.scrollTop = Math.max(0, nextScrollTop);
    loadMoreAnchorOffsetRef.current = null;
  }, [recommendationItems.length]);

  const handleOpenDetail = (item: RecommendationDisplayItem) => {
    setSelectedGame(toGameListItem(item));
  };

  const handleLoadMore = () => {
    const scrollContainer = recommendationScrollRef.current;

    if (scrollContainer) {
      loadMoreAnchorOffsetRef.current =
        scrollContainer.scrollHeight - scrollContainer.scrollTop;
    }

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

  const updateRecommendationResultsCache = (
    gameId: number,
    nextIsLiked: boolean,
  ) => {
    const updatePages = <
      TPage extends { results: Array<{ game_id: number; is_liked: boolean }> },
    >(
      data: InfiniteData<TPage> | undefined,
    ) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              results: page.results.map((result) =>
                result.game_id === gameId
                  ? { ...result, is_liked: nextIsLiked }
                  : result,
              ),
            })),
          }
        : data;

    queryClient.setQueryData<InfiniteData<SurveyResultResponse>>(
      ['survey-results'],
      updatePages,
    );
    queryClient.setQueryData<InfiniteData<MatchResultResponse>>(
      ['match-results'],
      updatePages,
    );
  };

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
      updateRecommendationResultsCache(response.gameId, response.isLiked);
      updateLikedGamesCache(variables.item, response.isLiked);
      setSelectedGame((current) =>
        current?.gameId === response.gameId
          ? { ...current, isLiked: response.isLiked }
          : current,
      );

      queryClient.setQueryData<GameDetail>(
        ['games', 'detail', response.gameId],
        (currentDetail) =>
          currentDetail
            ? {
                ...currentDetail,
                isLiked: response.isLiked,
                likeCount: response.likeCount,
              }
            : currentDetail,
      );

      try {
        const detail = await queryClient.fetchQuery({
          queryKey: ['games', 'detail', response.gameId],
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
      <Header fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-3 pt-24 pb-10 sm:px-4 sm:pt-28 sm:pb-12 md:px-8 md:pt-32 md:pb-16">
        <section className="mx-auto w-full max-w-[980px]">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-white/45 uppercase backdrop-blur-md">
                <Sparkles size={13} />
                AI Curated
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-[52px]">
                게임 추천 리스트
              </h1>
              <p className="mt-4 max-w-[620px] text-sm leading-7 break-keep text-white/58 sm:text-base">
                {isMatchSource
                  ? '장르별 매칭에서 남긴 별점과 좋아요를 바탕으로 정리된 추천 결과예요. 마음에 드는 게임은 좋아요로 표시해 두고 마이페이지에서도 다시 확인할 수 있어요.'
                  : '설문에서 드러난 취향을 바탕으로, 지금 바로 플레이하고 싶어질 만한 게임들을 차분하게 정리해뒀어요.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {recommendationHighlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/68 backdrop-blur-sm"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,20,0.88),rgba(9,9,10,0.92))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <p className="text-[11px] font-medium tracking-[0.22em] text-white/34 uppercase">
                Summary
              </p>
              <p className="mt-5 text-[34px] font-semibold tracking-[-0.04em] text-white">
                {cappedTotalCount > 0 ? cappedTotalCount : '...'}
              </p>
              <p className="mt-2 text-sm leading-6 break-keep text-white/52">
                {isMatchSource
                  ? '현재 매칭 평가를 기준으로 정리된 추천 결과예요.'
                  : '현재 설문 응답을 기준으로 정리된 추천 결과예요.'}
              </p>
            </aside>
          </div>

          {!isMockMode && !isAuthReady ? (
            <section className="survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
              <h2 className="text-2xl font-bold text-white">
                인증 상태를 확인하는 중입니다.
              </h2>
              <p className="mt-4 text-base leading-7 break-keep text-white/60">
                잠시만 기다려 주세요. 세션 확인 후 추천 결과를 불러옵니다.
              </p>
            </section>
          ) : !canAccessPage ? (
            <section className="survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
              <h2 className="text-2xl font-bold text-white">
                로그인 후 추천 결과를 볼 수 있어요.
              </h2>
              <p className="mt-4 text-base leading-7 break-keep text-white/60">
                실제 API 모드에서는 인증 토큰이 필요합니다. 개발 중에는 MSW를
                켜두면 추천 결과 흐름을 확인할 수 있습니다.
              </p>
            </section>
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
            <section className="overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.92),rgba(9,9,10,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
              <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
                <div className="flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.22em] text-white/34 uppercase">
                      Refined For You
                    </p>
                    <p className="mt-3 text-sm leading-6 break-keep text-white/56">
                      {isMatchSource
                        ? '장르별 매칭에서 수집한 선호도 평가를 바탕으로 정리된 결과예요.'
                        : '마음에 드는 게임을 비교해보고, 더보기로 결과를 이어서 확인해보세요.'}
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-white/48">
                    {cappedTotalCount > 0
                      ? `${cappedTotalCount}개의 추천 결과`
                      : '추천 결과를 정리하고 있어요'}
                  </div>
                </div>
                {likeFeedbackMessage ? (
                  <p className="mt-4 text-sm leading-6 break-keep text-[#ffc2c2]">
                    {likeFeedbackMessage}
                  </p>
                ) : null}
              </div>

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
                      className="flex w-full flex-col items-center justify-center gap-1 border-t border-white/8 px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/[0.03] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:px-6 lg:px-7"
                    >
                      <span>
                        {isFetchingNextPage
                          ? '추천 결과를 불러오는 중입니다...'
                          : '더보기'}
                      </span>
                      {!isFetchingNextPage ? (
                        <ChevronDown
                          size={18}
                          className="translate-y-[1px] text-white/56"
                        />
                      ) : null}
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
          onClose={() => setSelectedGame(null)}
        />
      ) : null}
    </div>
  );
}

export default RecommendationListPage;
