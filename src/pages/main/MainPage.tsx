import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Search,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import Header from '../../components/common/Header';
import { ROUTES } from '../../constants/routes';
import GameCard from '../../features/games/components/GameCard';
import GameDetailModal from '../../features/games/components/GameDetailModal';
import {
  GAME_CARD_BODY_CLASS,
  GAME_CARD_MEDIA_CLASS,
  GAME_CARD_SHELL_CLASS,
} from '../../features/games/components/gameCardLayout';
import { getTopGames, searchGames } from '../../features/games/gameApi';
import { GAME_GENRE_FILTERS } from '../../features/games/genres';
import { useDebouncedValue } from '../../features/games/hooks/useDebouncedValue';
import type { GameListItem } from '../../features/games/types';
import type { GameGenreFilter } from '../../features/games/genres';
import 'swiper/swiper.css';

const SEARCH_DEBOUNCE_MS = 300;
const GENRE_FILTER_MENU_ID = 'game-genre-filter-menu';
const CTA_PENDING_MESSAGE = '준비 중입니다.';
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

const MainPage = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GameGenreFilter>('전체');
  const [selectedGame, setSelectedGame] = useState<GameListItem | null>(null);
  const debouncedSearchText = useDebouncedValue(
    searchText.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const isSearchMode = debouncedSearchText.length > 0;

  const gamesQuery = useQuery({
    queryKey: [
      'games',
      isSearchMode ? 'search' : 'top100',
      debouncedSearchText,
      selectedGenre,
    ],
    queryFn: () =>
      isSearchMode
        ? searchGames({ search: debouncedSearchText, genre: selectedGenre })
        : getTopGames({ genre: selectedGenre }),
    staleTime: 60_000,
  });

  const games = gamesQuery.data ?? [];
  const sectionTitle = isSearchMode
    ? `"${debouncedSearchText}" 검색 결과`
    : '인기 TOP 100 🔥';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <Header fixed />
      <main className="min-h-screen pt-24 pb-10 text-white sm:pt-28 sm:pb-14 lg:h-screen lg:overflow-hidden lg:pt-24 lg:pb-4 xl:pt-26 xl:pb-5">
        <section className="w-full lg:flex lg:h-full lg:flex-col">
          <div className="flex flex-col gap-4 px-[clamp(1rem,5vw,20rem)] sm:flex-row sm:items-center sm:justify-between lg:gap-3">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:flex-nowrap">
              <h2 className="min-w-0 text-xl leading-tight font-bold wrap-break-word text-white sm:text-2xl lg:text-[28px]">
                {sectionTitle}
              </h2>
              <GenreFilter
                selectedGenre={selectedGenre}
                onSelectGenre={setSelectedGenre}
              />
            </div>

            <label className="relative block w-full sm:w-52 lg:w-56 xl:w-60">
              <span className="sr-only">게임명 검색</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/75"
              />
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="검색"
                className="h-10 w-full rounded-lg border border-white/35 bg-[#080808] pr-4 pl-12 text-sm text-white transition outline-none placeholder:text-white/75 focus:border-[#d20b12] focus:ring-2 focus:ring-[#d20b12]/30 sm:h-11 sm:text-base"
              />
            </label>
          </div>

          <div className="mt-4 sm:mt-5 lg:mt-4">
            {gamesQuery.isLoading ? (
              <GameCardSkeletonList />
            ) : games.length > 0 ? (
              <GameCarousel
                key={`${debouncedSearchText}-${selectedGenre}`}
                games={games}
                onSelectGame={setSelectedGame}
                showUpdatingOverlay={gamesQuery.isFetching}
              />
            ) : (
              <EmptyGameList
                isFiltered={isSearchMode || selectedGenre !== '전체'}
              />
            )}
          </div>

          <section className="mt-14 grid gap-6 px-[clamp(1rem,5vw,20rem)] lg:mt-6 lg:grid-cols-2 lg:gap-4 xl:mt-7">
            <RecommendationCta
              icon={ClipboardCheck}
              iconLabel="설문 작성"
              title="설문 조사"
              description="설문에 참여하고 나에게 꼭 맞는 게임을 찾아보세요!"
              buttonLabel="설문 시작"
              to={`/${ROUTES.SURVEY}`}
            />
            <RecommendationCta
              icon={Search}
              iconLabel="게임 찾기"
              title="장르별 매칭"
              description="어떤 게임을 할지 고민? 당신의 취향에 맞는 게임을 추천해드립니다!"
              buttonLabel="매칭 시작"
              to={`/${ROUTES.MATCHING_LIST}`}
            />
          </section>
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
};

type GenreFilterProps = {
  selectedGenre: GameGenreFilter;
  onSelectGenre: (genre: GameGenreFilter) => void;
};

const GenreFilter = ({ selectedGenre, onSelectGenre }: GenreFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null);

  const selectGenre = (genre: GameGenreFilter) => {
    onSelectGenre(genre);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen || !selectedOptionRef.current) {
      return;
    }

    selectedOptionRef.current.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }, [isOpen, selectedGenre]);

  return (
    <div
      className="relative w-full sm:w-36"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={GENRE_FILTER_MENU_ID}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/25 bg-[#0f0f0f] px-3 text-left text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition hover:border-[#d20b12]/70 hover:bg-[#151515] focus-visible:border-[#d20b12] focus-visible:ring-2 focus-visible:ring-[#d20b12]/30 focus-visible:outline-none sm:h-11"
      >
        <span className="truncate">{selectedGenre}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <ul
          id={GENRE_FILTER_MENU_ID}
          className="genre-menu-scrollbar bg-mypage-soft absolute top-full left-0 z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-white/15 p-1 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
        >
          {GAME_GENRE_FILTERS.map((genre) => {
            const isSelected = genre === selectedGenre;

            return (
              <li key={genre}>
                <button
                  type="button"
                  onClick={() => selectGenre(genre)}
                  ref={isSelected ? selectedOptionRef : undefined}
                  aria-label={isSelected ? `${genre} 선택됨` : `${genre} 선택`}
                  className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition ${
                    isSelected
                      ? 'bg-[#d20b12] font-semibold text-white'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="whitespace-nowrap">{genre}</span>
                  {isSelected ? (
                    <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

type GameCarouselProps = {
  games: GameListItem[];
  onSelectGame: (game: GameListItem) => void;
  showUpdatingOverlay?: boolean;
};

const GameCarousel = ({
  games,
  onSelectGame,
  showUpdatingOverlay = false,
}: GameCarouselProps) => {
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

const GameCardSkeletonList = () => (
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

const EmptyGameList = ({ isFiltered }: EmptyGameListProps) => {
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

const GameListUpdatingOverlay = () => (
  <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-lg">
    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
    <div className="absolute top-3 right-3 flex items-center gap-2">
      <div className="h-2.5 w-14 animate-pulse rounded-full bg-white/20" />
      <div className="h-2.5 w-8 animate-pulse rounded-full bg-white/15" />
    </div>
  </div>
);

type RecommendationCtaProps = {
  icon: typeof Search;
  iconLabel: string;
  title: string;
  description: string;
  buttonLabel: string;
  to?: string;
};

const RecommendationCta = ({
  icon,
  iconLabel,
  title,
  description,
  buttonLabel,
  to,
}: RecommendationCtaProps) => {
  const Icon = icon;
  const showPendingMessage = () => {
    window.alert(CTA_PENDING_MESSAGE);
  };
  const actionClassName =
    'hover:bg-header-accent-hover mt-7 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#d20b12] px-7 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]';

  return (
    <article className="flex min-h-65 flex-col items-center justify-center rounded-lg border border-[#3a0b0d] bg-[#050505] px-6 py-9 text-center sm:min-h-70 lg:min-h-56 lg:px-5 lg:py-7">
      <div
        role="img"
        aria-label={iconLabel}
        className="flex h-16 w-16 items-center justify-center text-[#d20b12] sm:h-18 sm:w-18"
      >
        <Icon aria-hidden="true" className="h-8 w-8 sm:h-9 sm:w-9" />
      </div>
      <h3 className="mt-4 text-2xl leading-tight font-bold sm:text-3xl lg:mt-3 lg:text-[28px]">
        {title}
      </h3>
      <p className="mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base lg:mt-3 lg:text-[15px] lg:leading-6">
        {description}
      </p>
      {to ? (
        <Link to={to} className={`${actionClassName} lg:mt-5`}>
          {buttonLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={showPendingMessage}
          title="준비 중입니다."
          className={`${actionClassName} lg:mt-5`}
        >
          {buttonLabel}
        </button>
      )}
    </article>
  );
};

export default MainPage;
