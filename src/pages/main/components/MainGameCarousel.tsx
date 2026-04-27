import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';

import GameCard from '../../../features/games/components/GameCard';
import {
  GAME_CARD_BODY_CLASS,
  GAME_CARD_MEDIA_CLASS,
  GAME_CARD_SHELL_CLASS,
} from '../../../features/games/components/gameCardLayout';
import type { GameListItem } from '../../../features/games/types';
import 'swiper/swiper.css';

const GAME_CARD_SWIPER_BREAKPOINTS = {
  640: {
    slidesPerView: 2,
    slidesPerGroup: 2,
    spaceBetween: 20,
  },
  768: {
    slidesPerView: 3,
    slidesPerGroup: 3,
    spaceBetween: 24,
  },
  1024: {
    slidesPerView: 4,
    slidesPerGroup: 4,
    spaceBetween: 24,
  },
  1280: {
    slidesPerView: 5,
    slidesPerGroup: 5,
    spaceBetween: 24,
  },
  1440: {
    slidesPerView: 6,
    slidesPerGroup: 6,
    spaceBetween: 24,
  },
} as const;
const GAME_CARD_SKELETON_COUNT = 6;

type MainGameCarouselProps = {
  games: GameListItem[];
  onSelectGame: (game: GameListItem) => void;
  showUpdatingOverlay?: boolean;
};

const MainGameCarousel = ({
  games,
  onSelectGame,
  showUpdatingOverlay = false,
}: MainGameCarouselProps) => {
  const swiperRef = useRef<SwiperInstance | null>(null);

  const scrollCards = (direction: 'previous' | 'next') => {
    const swiper = swiperRef.current;

    if (!swiper) {
      return;
    }

    if (direction === 'previous') {
      swiper.slidePrev();
      return;
    }

    swiper.slideNext();
  };

  return (
    <GameCardSwiperFrame
      showNavigation
      showUpdatingOverlay={showUpdatingOverlay}
      onPrevious={() => scrollCards('previous')}
      onNext={() => scrollCards('next')}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
      }}
    >
      {games.map((game) => (
        <SwiperSlide key={game.gameId} className="h-auto!">
          <GameCard game={game} onSelectGame={onSelectGame} />
        </SwiperSlide>
      ))}
    </GameCardSwiperFrame>
  );
};

type GameCardSwiperFrameProps = {
  children: ReactNode;
  showNavigation?: boolean;
  showUpdatingOverlay?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onSwiper?: (swiper: SwiperInstance) => void;
};

const GameCardSwiperFrame = ({
  children,
  showNavigation = false,
  showUpdatingOverlay = false,
  onPrevious,
  onNext,
  onSwiper,
}: GameCardSwiperFrameProps) => (
  <div className="group/carousel relative left-1/2 w-screen -translate-x-1/2">
    {showNavigation && onPrevious ? (
      <SlideButton direction="previous" onClick={onPrevious} />
    ) : null}

    <div className="px-[clamp(1rem,5vw,20rem)] py-2">
      <div className="relative">
        <Swiper
          onSwiper={onSwiper}
          slidesPerView={1}
          slidesPerGroup={1}
          spaceBetween={20}
          speed={450}
          watchOverflow
          breakpoints={GAME_CARD_SWIPER_BREAKPOINTS}
          className="overflow-visible!"
        >
          {children}
        </Swiper>
        {showUpdatingOverlay ? <GameListUpdatingOverlay /> : null}
      </div>
    </div>

    {showNavigation && onNext ? (
      <SlideButton direction="next" onClick={onNext} />
    ) : null}
  </div>
);

type SlideButtonProps = {
  direction: 'previous' | 'next';
  onClick: () => void;
};

const SlideButton = ({ direction, onClick }: SlideButtonProps) => {
  const isPrevious = direction === 'previous';
  const Icon = isPrevious ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrevious ? '이전 게임 보기' : '다음 게임 보기'}
      className={`group/slide-button absolute top-0 bottom-0 z-20 flex w-[clamp(1rem,5vw,20rem)] cursor-pointer items-center justify-center bg-black/50 text-white opacity-45 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#d20b12] md:opacity-0 md:group-hover/carousel:opacity-100 ${
        isPrevious ? 'left-0' : 'right-0'
      }`}
    >
      <Icon
        aria-hidden="true"
        className="relative z-10 h-7 w-7 transition-transform duration-200 group-hover/slide-button:scale-110"
      />
    </button>
  );
};

export const GameCardSkeletonList = () => (
  <GameCardSwiperFrame>
    {Array.from({ length: GAME_CARD_SKELETON_COUNT }, (_, index) => (
      <SwiperSlide key={index} className="h-auto!">
        <div className={`${GAME_CARD_SHELL_CLASS} animate-pulse`}>
          <div className={`${GAME_CARD_MEDIA_CLASS} bg-white/5`} />
          <div className={GAME_CARD_BODY_CLASS}>
            <div className="min-w-0">
              <div className="h-5 w-40 rounded bg-white/10" />
              <div className="mt-3 h-4 w-24 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </SwiperSlide>
    ))}
  </GameCardSwiperFrame>
);

type EmptyGameListProps = {
  isFiltered: boolean;
};

const useGameCardEmptyStateHeight = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;

    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }

    const compute = () => {
      const containerWidth = el.getBoundingClientRect().width;
      const vw = window.innerWidth;

      const sorted = (
        Object.keys(GAME_CARD_SWIPER_BREAKPOINTS) as unknown as number[]
      )
        .map(Number)
        .sort((a, b) => b - a);

      let perView = 1;
      let gap = 20;

      for (const bp of sorted) {
        if (vw >= bp) {
          const config =
            GAME_CARD_SWIPER_BREAKPOINTS[
              bp as keyof typeof GAME_CARD_SWIPER_BREAKPOINTS
            ];
          perView = config.slidesPerView;
          gap = config.spaceBetween;
          break;
        }
      }

      const slideWidth = (containerWidth - gap * (perView - 1)) / perView;
      setCardHeight(Math.round(slideWidth * (5 / 4) + 92));
    };

    compute();

    const resizeObserver = new ResizeObserver(compute);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { cardHeight, containerRef };
};

export const EmptyGameList = ({ isFiltered }: EmptyGameListProps) => {
  const { cardHeight, containerRef } = useGameCardEmptyStateHeight();

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div className="px-[clamp(1rem,5vw,20rem)] py-2">
        <div ref={containerRef}>
          <div
            className="bg-mypage-soft flex items-center justify-center rounded-lg border border-white/10 px-6 text-center"
            style={cardHeight ? { height: `${cardHeight}px` } : undefined}
          >
            <p className="text-base text-white/65">
              {isFiltered
                ? '조건에 맞는 게임 목록이 없습니다.'
                : '표시할 인기 게임 목록이 없습니다.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

type ErrorGameListProps = {
  message: string;
  onRetry: () => void;
};

export const ErrorGameList = ({ message, onRetry }: ErrorGameListProps) => {
  const { cardHeight, containerRef } = useGameCardEmptyStateHeight();

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div className="px-[clamp(1rem,5vw,20rem)] py-2">
        <div ref={containerRef}>
          <div
            className="bg-mypage-soft flex flex-col items-center justify-center gap-5 rounded-lg border border-[#5a1115]/60 px-6 text-center"
            style={cardHeight ? { minHeight: `${cardHeight}px` } : undefined}
          >
            <p className="max-w-xl text-base leading-7 text-white/70">
              {message}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/3 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-[#d20b12]/60 hover:bg-[#160b0b] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d20b12]"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              다시 시도
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GameListUpdatingOverlay = () => (
  <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-lg">
    <div className="absolute top-3 right-3 flex items-center gap-2">
      <div className="h-2.5 w-14 animate-pulse rounded-full bg-white/22 shadow-[0_0_12px_rgba(255,255,255,0.08)]" />
      <div className="h-2.5 w-8 animate-pulse rounded-full bg-white/16 shadow-[0_0_12px_rgba(255,255,255,0.05)]" />
    </div>
  </div>
);

export default MainGameCarousel;
