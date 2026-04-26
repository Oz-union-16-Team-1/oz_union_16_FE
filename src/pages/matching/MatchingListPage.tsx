import { ChevronRight } from 'lucide-react';
import { useLayoutEffect, useMemo } from 'react';
import { Link, Navigate, useLocation } from 'react-router';

import AuthGateStatusPanel from '../../components/auth/AuthGateStatusPanel';
import LazyHeader from '../../components/common/LazyHeader';
import { ROUTES } from '../../constants/routes';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import { useMatchingGenreImageQueries } from '../../features/matching/api/useMatchingApi';
import { MATCHING_GENRES } from '../../features/matching/genres';
import { useMatchingStore } from '../../features/matching/store/useMatchingStore';

function MatchingListPage() {
  const location = useLocation();
  const authGate = useAuthGate();
  const canAccessPage = authGate.accessStatus === 'authorized';
  const canFetchGenreImages = canAccessPage;
  const resetFlow = useMatchingStore((state) => state.resetFlow);
  const genreImageQueries = useMatchingGenreImageQueries(
    MATCHING_GENRES.map((genre) => genre.genreId),
    canFetchGenreImages,
  );
  const genreImageMap = useMemo(
    () =>
      new Map(
        genreImageQueries
          .map((query) => query.data)
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .map((item) => [item.genre_id, item.image_url]),
      ),
    [genreImageQueries],
  );

  useLayoutEffect(() => {
    resetFlow();
  }, [resetFlow]);

  if (authGate.accessStatus === 'unauthorized') {
    return (
      <Navigate
        to={`/${ROUTES.LOGIN}`}
        replace
        state={{
          noticeMessage: '로그인 후 매칭을 시작할 수 있어요.',
          redirectTo: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,25,25,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)] opacity-90" />
      <LazyHeader fixed />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-280 px-4 pt-22 pb-12 sm:px-6 sm:pt-24 md:px-8 md:pt-25 md:pb-14">
        {authGate.accessStatus === 'loading' ? (
          <AuthGateStatusPanel
            title="인증 상태를 확인하는 중입니다."
            description="잠시만 기다려 주세요. 세션 확인 후 장르별 매칭 화면을 보여드릴게요."
            align="center"
            className="mx-auto max-w-190 sm:py-12"
          />
        ) : !canAccessPage ? (
          <AuthGateStatusPanel
            title="로그인 후 매칭을 시작할 수 있어요."
            description="로그인하면 장르를 고르고 트레일러를 보며 별점을 남긴 뒤, 취향에 맞는 추천 결과까지 바로 이어서 확인할 수 있어요."
            align="center"
            className="mx-auto max-w-190 sm:py-12"
          />
        ) : (
          <section className="mx-auto max-w-240">
            <div className="mb-7 text-center sm:mb-8">
              <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
                Matching
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[42px]">
                장르별 게임 매칭
              </h1>
              <p className="mt-3 text-sm leading-6 break-keep text-white/58 sm:text-[15px]">
                좋아하는 장르를 고르고 트레일러를 보며 별점을 남기면, 취향에
                맞는 게임을 빠르게 추천해드려요.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {MATCHING_GENRES.map((genre) => (
                <Link
                  key={genre.slug}
                  to={`/${ROUTES.MATCHING_LIST}/${genre.slug}`}
                  className="group overflow-hidden rounded-3xl border border-white/8 bg-[#0c0c0d] p-2.5 shadow-[0_18px_36px_rgba(0,0,0,0.26)] transition hover:border-[#a31c1c]/65 hover:bg-[#111112]"
                >
                  <div className="relative overflow-hidden rounded-[18px]">
                    <img
                      src={
                        genreImageMap.get(genre.genreId) ?? genre.thumbnailUrl
                      }
                      alt={genre.title}
                      className="aspect-[16/8.4] w-full object-cover transition duration-300 group-hover:scale-[1.025] group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,8,0.1),rgba(6,6,8,0.28)_34%,rgba(6,6,8,0.86))]" />
                    <div className="absolute right-3.5 bottom-3.5 left-3.5 flex items-end justify-between gap-3">
                      <div>
                        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                          {genre.title}
                        </h2>
                        <p className="mt-1.5 max-w-[24ch] text-[13px] leading-5 font-medium break-keep text-white/86 [text-shadow:0_1px_10px_rgba(0,0,0,0.65)]">
                          {genre.description}
                        </p>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/28 text-white/78 transition group-hover:border-[#b02525]/60 group-hover:text-white">
                        <ChevronRight size={17} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default MatchingListPage;
