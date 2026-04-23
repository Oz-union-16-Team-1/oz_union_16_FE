import { ChevronRight, Search, X } from 'lucide-react';
import { useRef } from 'react';
import type { GameListItem } from '../../../features/games/types';
import type { MainPageGamesState } from '../hooks/useMainPageGames';
import MainGameCarousel, {
  EmptyGameList,
  GameCardSkeletonList,
} from './MainGameCarousel';
import MainGenreFilter from './MainGenreFilter';

type MainGamesSectionProps = MainPageGamesState & {
  onSelectGame: (game: GameListItem) => void;
};

const MainGamesSection = ({
  searchText,
  selectedGenre,
  sectionTitle,
  carouselKey,
  games,
  isGamesLoading,
  isGamesUpdating,
  isFiltered,
  hasMoreSearchResults,
  isFetchingMoreSearchResults,
  setSearchText,
  setSelectedGenre,
  fetchMoreSearchResults,
  onSelectGame,
}: MainGamesSectionProps) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const clearSearchText = () => {
    setSearchText('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="mt-4 sm:mt-5 lg:mt-4">
      <div className="flex flex-col gap-4 px-[clamp(1rem,5vw,20rem)] sm:flex-row sm:items-center sm:justify-between lg:gap-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:flex-nowrap">
          <h2 className="min-w-0 text-xl leading-tight font-bold wrap-break-word text-white sm:text-2xl lg:text-[28px]">
            {sectionTitle}
          </h2>
          <MainGenreFilter
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
            ref={searchInputRef}
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="검색"
            className="h-10 w-full appearance-none rounded-lg border border-white/35 bg-[#080808] pr-11 pl-12 text-sm text-white transition outline-none placeholder:text-white/75 focus:border-[#d20b12] focus:ring-2 focus:ring-[#d20b12]/30 sm:h-11 sm:text-base [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {searchText ? (
            <button
              type="button"
              onClick={clearSearchText}
              aria-label="검색어 지우기"
              className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d20b12]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
        </label>
      </div>

      {isGamesLoading ? (
        <GameCardSkeletonList />
      ) : games.length > 0 ? (
        <>
          <MainGameCarousel
            key={carouselKey}
            games={games}
            onSelectGame={onSelectGame}
            showUpdatingOverlay={isGamesUpdating}
          />
          {hasMoreSearchResults ? (
            <SearchResultMoreAction
              isLoading={isFetchingMoreSearchResults}
              onClick={fetchMoreSearchResults}
            />
          ) : null}
        </>
      ) : (
        <EmptyGameList isFiltered={isFiltered} />
      )}
    </div>
  );
};

type SearchResultMoreActionProps = {
  isLoading: boolean;
  onClick: () => void;
};

const SearchResultMoreAction = ({
  isLoading,
  onClick,
}: SearchResultMoreActionProps) => (
  <div className="mt-4 flex justify-end px-[clamp(1rem,5vw,20rem)]">
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="inline-flex min-w-30 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm font-medium text-white/82 transition hover:border-[#6f2525] hover:bg-[#160b0b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
    >
      {isLoading ? '불러오는 중...' : '더보기'}
      {!isLoading ? (
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      ) : null}
    </button>
  </div>
);

export default MainGamesSection;
