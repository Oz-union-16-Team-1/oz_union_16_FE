import {
  ChevronDown,
  ChevronRight,
  Heart,
  RotateCcw,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import AuthGateStatusPanel from '../../components/auth/AuthGateStatusPanel';
import ActionButton from '../../components/common/ActionButton';
import LazyHeader from '../../components/common/LazyHeader';
import { ROUTES } from '../../constants/routes';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import GameDetailModal from '../../features/games/components/GameDetailModal';
import type { GameListItem } from '../../features/games/types';
import { useRecommendationLike } from '../../features/recommendation/hooks/useRecommendationLike';
import { useRecommendationResultsSource } from '../../features/recommendation/hooks/useRecommendationResultsSource';
import { useRecommendationScrollRestoration } from '../../features/recommendation/hooks/useRecommendationScrollRestoration';
import { useSurveyRecommendationActions } from '../../features/recommendation/hooks/useSurveyRecommendationActions';
import type { RecommendationDisplayItem } from '../../features/recommendation/types';
import { formatRecommendationRating } from '../../features/recommendation/utils/normalizeRecommendationItem';

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

        <p className="mt-2 text-sm leading-6 break-keep text-white/54">
          {item.genres.join(' / ') || '장르 정보 준비 중'}
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
              ? 'border-[#c12626]/70 bg-[#220b0b] text-[#f25a5a]'
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

type RecommendationPromptCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
};

function RecommendationRowSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 px-4 py-5 sm:grid-cols-[118px_minmax(0,1fr)] sm:items-center sm:px-6 sm:py-6 lg:grid-cols-[118px_minmax(0,1fr)_auto] lg:gap-6 lg:px-7">
      <div className="overflow-hidden rounded-[20px] border border-white/6 bg-white/[0.03]">
        <div className="h-23.5 w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.08),rgba(255,255,255,0.03))] sm:h-22" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="h-7 w-48 rounded-full bg-white/10 sm:h-8 sm:w-56" />
          <div className="h-6 w-16 rounded-full bg-[#702525]/35" />
        </div>
        <div className="mt-3 h-4 w-3/5 rounded-full bg-white/7" />
      </div>

      <div className="flex items-center justify-end gap-3 lg:min-w-24">
        <div className="h-10 w-10 rounded-full bg-white/[0.05]" />
        <div className="h-10 w-10 rounded-full bg-white/[0.05]" />
      </div>
    </div>
  );
}

function RecommendationListSkeleton() {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.92),rgba(9,9,10,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
      <div className="divide-y divide-white/8">
        {Array.from({ length: 5 }).map((_, index) => (
          <RecommendationRowSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

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

function RecommendationPromptCard({
  title,
  description,
  ctaLabel,
  to,
}: RecommendationPromptCardProps) {
  return (
    <section className="survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-4 text-base leading-7 break-keep text-white/60">
        {description}
      </p>
      <Link
        to={to}
        className="mt-6 inline-flex rounded-2xl bg-[linear-gradient(135deg,#ff3535,#9f1212)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}

function RecommendationPageLoadingState() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <RecommendationBackdrop items={[]} />
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-300 flex-col px-3 pt-24 pb-8 sm:px-4 sm:pt-28 sm:pb-10 md:h-dvh md:max-h-dvh md:overflow-hidden md:px-8 md:pt-[5.45rem] md:pb-6">
        <section className="mx-auto flex min-h-0 w-full max-w-245 flex-1 flex-col">
          <div className="mb-8">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
              <div className="hidden md:block" />

              <div className="text-center">
                <div className="relative">
                  <h1 className="text-3xl font-semibold tracking-[-0.04em] text-transparent sm:text-4xl md:text-[52px]">
                    게임 추천 리스트
                  </h1>
                  <div className="absolute top-1/2 left-1/2 h-12 w-72 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>

              <div className="flex justify-center gap-2.5 md:justify-end">
                <div className="h-[50px] w-31 animate-pulse rounded-2xl border border-white/10 bg-white/4" />
                <div className="h-[50px] w-31 animate-pulse rounded-2xl border border-white/10 bg-white/4" />
              </div>
            </div>
          </div>

          <RecommendationListSkeleton />
        </section>
      </main>
    </div>
  );
}

function RecommendationListPage() {
  const [selectedGame, setSelectedGame] = useState<GameListItem | null>(null);
  const authGate = useAuthGate({ allowMockBypass: true });
  const canAccessPage = authGate.accessStatus === 'authorized';
  const {
    isMatchSource,
    isSurveySource,
    recommendationItems,
    errorMessage,
    emptyStateMessage,
    hasBlockingError,
    shouldShowMatchEntryCta,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useRecommendationResultsSource({ canAccessPage });
  const {
    pendingLikeGameId,
    feedbackMessage,
    setFeedbackMessage,
    handleToggleLike,
  } = useRecommendationLike({
    onSelectedGameLikeChange: (gameId, isLiked) => {
      setSelectedGame((current) =>
        current?.gameId === gameId ? { ...current, isLiked } : current,
      );
    },
  });
  const {
    recommendationScrollRef,
    handleOpenDetail,
    handleCloseDetail,
    handleLoadMore,
  } = useRecommendationScrollRestoration({
    itemCount: recommendationItems.length,
    fetchNextPage,
    setSelectedGame,
  });
  const {
    shouldShowSurveyActions,
    isResettingSurvey,
    handleViewPreviousSurvey,
    handleResetSurvey,
  } = useSurveyRecommendationActions({
    canAccessPage,
    isSurveySource,
    onBeforeReset: () => setSelectedGame(null),
    setFeedbackMessage,
  });

  if (authGate.needsAuthCheck) {
    return <RecommendationPageLoadingState />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <RecommendationBackdrop items={recommendationItems} />
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-300 flex-col px-3 pt-24 pb-8 sm:px-4 sm:pt-28 sm:pb-10 md:h-dvh md:max-h-dvh md:overflow-hidden md:px-8 md:pt-[5.45rem] md:pb-6">
        <section className="mx-auto flex min-h-0 w-full max-w-245 flex-1 flex-col">
          <div className="mb-8">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
              <div className="hidden md:block" />

              <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-[52px]">
                  게임 추천 리스트
                </h1>
              </div>

              {shouldShowSurveyActions ? (
                <div className="flex flex-wrap items-center justify-center gap-2.5 md:justify-end">
                  <button
                    type="button"
                    onClick={handleViewPreviousSurvey}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm font-semibold text-white/88 transition hover:border-white/20 hover:bg-white/6"
                  >
                    이전 설문 보기
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResetSurvey()}
                    disabled={isResettingSurvey}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm font-semibold text-white/88 transition hover:border-white/20 hover:bg-white/6 disabled:opacity-60"
                  >
                    <RotateCcw size={16} />
                    {isResettingSurvey ? '설문 초기화 중...' : '설문 초기화'}
                  </button>
                </div>
              ) : (
                <div className="hidden md:block" />
              )}
            </div>
          </div>

          {!canAccessPage ? (
            <AuthGateStatusPanel
              title="로그인 후 추천 결과를 볼 수 있어요."
              description="실제 API 모드에서는 인증 토큰이 필요합니다. 개발 중에는 MSW를 켜두면 추천 결과 흐름을 확인할 수 있습니다."
            />
          ) : !isMatchSource && !isSurveySource ? (
            <RecommendationPromptCard
              title="먼저 설문을 완료해 주세요."
              description="설문이 끝나면 추천 결과를 이 페이지에서 바로 확인할 수 있어요."
              ctaLabel="설문 페이지로 이동"
              to={`/${ROUTES.SURVEY}`}
            />
          ) : shouldShowMatchEntryCta ? (
            <RecommendationPromptCard
              title="먼저 매칭 평가를 완료해 주세요."
              description="좋아하는 장르를 고르고 최대 5개 게임의 트레일러를 보며 별점을 남기면 추천 결과가 바로 준비돼요."
              ctaLabel="매칭 페이지로 이동"
              to={`/${ROUTES.MATCHING_LIST}`}
            />
          ) : (
            <section className="flex min-h-0 flex-col overflow-hidden rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.92),rgba(9,9,10,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
              {feedbackMessage ? (
                <div className="border-b border-white/8 px-4 py-4 sm:px-6 lg:px-7">
                  <p className="text-sm leading-6 break-keep text-[#ffc2c2]">
                    {feedbackMessage}
                  </p>
                </div>
              ) : null}

              {isLoading ? (
                <RecommendationListSkeleton />
              ) : hasBlockingError ? (
                <div className="px-4 py-12 text-[#ffc2c2] sm:px-6 lg:px-7">
                  {errorMessage}
                </div>
              ) : recommendationItems.length === 0 ? (
                <div className="px-4 py-12 text-white/55 sm:px-6 lg:px-7">
                  {emptyStateMessage}
                </div>
              ) : (
                <>
                  <div
                    ref={recommendationScrollRef}
                    className="recommendation-scroll min-h-0 flex-1 overflow-y-auto"
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
                      className="flex w-full items-center justify-center gap-2 border-t border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.03))] px-4 py-2.5 text-sm font-medium text-white/82 transition hover:bg-white/4 hover:text-white disabled:opacity-45 sm:px-6 lg:px-7"
                    >
                      {!isFetchingNextPage ? (
                        <ChevronDown
                          size={16}
                          className="translate-y-px text-white/56"
                        />
                      ) : null}
                      <span>
                        {isFetchingNextPage
                          ? '추천 결과를 불러오는 중입니다...'
                          : '더보기'}
                      </span>
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
