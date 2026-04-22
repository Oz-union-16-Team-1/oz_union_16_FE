import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';

import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import { useMatchingGenreImageQueries } from '../../features/matching/api/useMatchingApi';
import { MATCHING_GENRES } from '../../features/matching/genres';
import { isMockServiceWorkerEnabled } from '../../lib/env';
import { getAccessToken } from '../../utils/auth';

function MatchingListPage() {
  const hasAccessToken = Boolean(getAccessToken());
  const isMockMode = isMockServiceWorkerEnabled();
  const canFetchGenreImages = isMockMode || hasAccessToken;
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,25,25,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)] opacity-90" />
      <Header fixed />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-[1120px] px-4 pt-[5.5rem] pb-12 sm:px-6 sm:pt-24 md:px-8 md:pt-[6.25rem] md:pb-14">
        <section className="mx-auto max-w-[960px]">
          <div className="mb-7 text-center sm:mb-8">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
              Matching
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[42px]">
              장르별 게임 매칭
            </h1>
            <p className="mt-3 text-sm leading-6 break-keep text-white/58 sm:text-[15px]">
              다양한 카테고리의 게임을 만나보세요!
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {MATCHING_GENRES.map((genre) => (
              <Link
                key={genre.slug}
                to={`/${ROUTES.MATCHING_LIST}/${genre.slug}`}
                className="group overflow-hidden rounded-[24px] border border-white/8 bg-[#0c0c0d] p-2.5 shadow-[0_18px_36px_rgba(0,0,0,0.26)] transition hover:border-[#a31c1c]/65 hover:bg-[#111112]"
              >
                <div className="relative overflow-hidden rounded-[18px]">
                  <img
                    src={genreImageMap.get(genre.genreId) ?? genre.thumbnailUrl}
                    alt={genre.title}
                    className="aspect-[16/8.4] w-full object-cover transition duration-300 group-hover:scale-[1.025] group-hover:brightness-110"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,8,0.18),rgba(6,6,8,0.72))]" />
                  <p className="absolute top-3.5 left-3.5 text-[10px] font-medium tracking-[0.2em] text-white/76 uppercase">
                    {genre.subtitle}
                  </p>
                  <div className="absolute right-3.5 bottom-3.5 left-3.5 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                        {genre.title}
                      </h2>
                      <p className="mt-1.5 max-w-[24ch] text-[13px] leading-5 break-keep text-white/72">
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
      </main>
    </div>
  );
}

export default MatchingListPage;
