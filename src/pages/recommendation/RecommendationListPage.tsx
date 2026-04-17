import { ChevronRight, Heart, Sparkles, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import { useMatchResultsInfinite } from '../../features/matching/api/useMatchingApi';
import type { MatchResultItem } from '../../features/matching/types';
import { useSurveyResultsInfinite } from '../../features/survey/api/useSurveyApi';
import { extractApiErrorMessage } from '../../features/survey/api/survey';
import type { SurveyResultItem } from '../../features/survey/types/survey';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { getAccessToken } from '../../utils/auth';

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

const getDisplayPrice = (gameId: number) =>
  gameId % 4 === 0 ? '가격: 무료' : '가격: 정보 준비 중';

const FALLBACK_HIGHLIGHTS = ['몰입감', '스토리', '액션', '전략'];

type RecommendationDisplayItem = {
  game_id: number;
  title: string;
  genres: string[];
  thumbnail_url: string | null;
  rating: number | null;
  is_liked: boolean;
};

const normalizeResultItem = (
  item: SurveyResultItem | MatchResultItem,
): RecommendationDisplayItem =>
  'title' in item
    ? item
    : {
        game_id: item.game_id,
        title: item.name,
        genres: item.genres,
        thumbnail_url: item.thumbnail_url,
        rating: item.rating,
        is_liked: item.is_liked,
      };

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
};

function RecommendationRow({ item }: RecommendationRowProps) {
  return (
    <article className="group grid gap-4 px-4 py-5 transition-colors duration-200 hover:bg-white/[0.025] sm:grid-cols-[118px_minmax(0,1fr)] sm:items-center sm:px-6 sm:py-6 lg:grid-cols-[118px_minmax(0,1fr)_auto] lg:gap-6 lg:px-7">
      <div className="overflow-hidden rounded-[20px] border border-white/6 bg-[#111111] shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
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
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="truncate text-[22px] font-semibold tracking-[-0.02em] text-white sm:text-[26px]">
            {item.title}
          </h2>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#702525]/40 bg-[#190a0a]/55 px-2.5 py-1 text-[12px] font-semibold text-white/88">
            <Star size={12} className="fill-[#d85858] text-[#d85858]" />
            {item.rating?.toFixed(1) ?? 'N/A'}
          </div>
        </div>

        <p className="mt-2 text-[11px] font-medium tracking-[0.22em] text-white/32 uppercase">
          {item.genres.join(' · ') || '장르 정보 준비 중'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end lg:min-w-[240px] lg:flex-nowrap">
        <div className="min-w-[110px] lg:text-right">
          <p className="text-[11px] font-medium tracking-[0.18em] text-white/28 uppercase">
            Price
          </p>
          <p className="mt-1 text-sm text-white/62">
            {getDisplayPrice(item.game_id)}
          </p>
        </div>

        <button
          type="button"
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
            item.is_liked
              ? 'border-[#6f2525] bg-[#170b0b] text-[#f07373]'
              : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/18 hover:text-white/86'
          }`}
          aria-label="좋아요 상태"
        >
          <Heart size={16} fill={item.is_liked ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          aria-label={`${item.title} 상세 보기 준비 중`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-white/42 transition group-hover:border-white/8 group-hover:bg-white/[0.03] group-hover:text-white/82"
        >
          <ChevronRight size={18} />
        </button>
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
  const sessionId = searchParams.get('session_id');
  const source = searchParams.get('source');
  const isMatchSource = source === 'match';
  const isMockMode = isMockServiceWorkerEnabled();
  const hasAccessToken = Boolean(getAccessToken());
  const canAccessPage = isMockMode || hasAccessToken;

  const surveyResultsQuery = useSurveyResultsInfinite(
    sessionId,
    !isMatchSource && canAccessPage,
  );
  const matchResultsQuery = useMatchResultsInfinite(
    'rating_desc',
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
                  ? '매칭 평가에서 남긴 별점과 좋아요를 바탕으로, 바로 확인해볼 만한 결과를 정리했어요.'
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
                {totalCount > 0 ? totalCount : '...'}
              </p>
              <p className="mt-2 text-sm leading-6 break-keep text-white/52">
                {isMatchSource
                  ? '현재 매칭 평가를 기준으로 정리된 추천 결과예요.'
                  : '현재 설문 응답을 기준으로 정리된 추천 결과예요.'}
              </p>
            </aside>
          </div>

          {!canAccessPage ? (
            <section className="survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
              <h2 className="text-2xl font-bold text-white">
                로그인 후 추천 결과를 볼 수 있어요.
              </h2>
              <p className="mt-4 text-base leading-7 break-keep text-white/60">
                실제 API 모드에서는 인증 토큰이 필요합니다. 개발 중에는 MSW를
                켜두면 추천 결과 흐름을 확인할 수 있습니다.
              </p>
            </section>
          ) : !sessionId && !isMatchSource ? (
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
                장르별 매칭에서 5개 게임 평가를 제출하면 추천 결과를 이
                페이지에서 바로 확인할 수 있어요.
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
                        ? '평가를 바탕으로 정리된 결과를 비교해보고 마음에 드는 게임을 골라보세요.'
                        : '마음에 드는 게임을 비교해보고, 더보기로 결과를 이어서 확인해보세요.'}
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-white/48">
                    {totalCount > 0
                      ? `${totalCount}개의 추천 결과`
                      : '추천 결과를 정리하고 있어요'}
                  </div>
                </div>
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
                  <div className="recommendation-scroll max-h-[62vh] overflow-y-auto">
                    <div className="divide-y divide-white/8">
                      {recommendationItems.map((item) => (
                        <RecommendationRow key={item.game_id} item={item} />
                      ))}
                    </div>
                  </div>

                  {hasNextPage || isFetchingNextPage ? (
                    <div className="flex justify-end border-t border-white/8 px-4 py-4 sm:px-6 lg:px-7">
                      <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/82 transition hover:border-[#6f2525] hover:bg-[#160b0b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {isFetchingNextPage ? '불러오는 중...' : '더보기'}
                        {!isFetchingNextPage ? (
                          <ChevronRight size={16} />
                        ) : null}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default RecommendationListPage;
