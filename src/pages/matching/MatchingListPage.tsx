import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import { MATCHING_GENRES } from '../../features/matching/genres';

function MatchingListPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,25,25,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%)] opacity-90" />
      <Header fixed />

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-[1180px] px-4 pt-24 pb-14 sm:px-6 sm:pt-28 md:px-8 md:pt-32 md:pb-18">
        <section className="mx-auto max-w-[920px]">
          <div className="mb-10 text-center sm:mb-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#d93737] uppercase">
              Matching
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-[44px]">
              장르별 게임 매칭
            </h1>
            <p className="mt-4 text-sm leading-6 break-keep text-white/58 sm:text-base">
              다양한 카테고리의 게임을 만나보세요!
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {MATCHING_GENRES.map((genre) => (
              <Link
                key={genre.slug}
                to={`/${ROUTES.MATCHING_LIST}/${genre.slug}`}
                className="group overflow-hidden rounded-[26px] border border-white/8 bg-[#0c0c0d] p-3 shadow-[0_20px_42px_rgba(0,0,0,0.28)] transition hover:border-[#a31c1c]/65 hover:bg-[#111112]"
              >
                <div className="relative overflow-hidden rounded-[20px]">
                  <img
                    src={genre.thumbnailUrl}
                    alt={genre.title}
                    className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.025] group-hover:brightness-110"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,8,0.18),rgba(6,6,8,0.72))]" />
                  <p className="absolute top-4 left-4 text-[11px] font-medium tracking-[0.2em] text-white/76 uppercase">
                    {genre.subtitle}
                  </p>
                  <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
                        {genre.title}
                      </h2>
                      <p className="mt-2 max-w-[28ch] text-sm leading-6 break-keep text-white/72">
                        {genre.description}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/28 text-white/78 transition group-hover:border-[#b02525]/60 group-hover:text-white">
                      <ChevronRight size={18} />
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
