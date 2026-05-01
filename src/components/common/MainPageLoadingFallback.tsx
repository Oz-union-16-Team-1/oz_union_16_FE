import LazyHeader from './LazyHeader';
import { GameCardSkeletonList } from '../../pages/main/components/MainGameCarousel';

type MainPageLoadingFallbackProps = {
  className?: string;
};

function MainPageLoadingFallback({
  className = '',
}: MainPageLoadingFallbackProps) {
  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[#050505] text-white ${className}`.trim()}
    >
      <LazyHeader fixed />
      <main
        aria-busy="true"
        aria-live="polite"
        className="min-h-screen pt-24 pb-10 sm:pt-28 sm:pb-14 lg:h-screen lg:overflow-hidden lg:pt-24 lg:pb-4 xl:pt-26 xl:pb-5"
      >
        <span className="sr-only">화면을 준비하고 있습니다.</span>
        <section className="w-full lg:flex lg:h-full lg:flex-col">
          <div className="mt-4 sm:mt-5 lg:mt-4">
            <GameCardSkeletonList />
          </div>
        </section>
      </main>
    </div>
  );
}

export default MainPageLoadingFallback;
