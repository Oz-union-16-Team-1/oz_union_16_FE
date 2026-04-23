import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  GAME_GENRE_FILTERS,
  type GameGenreFilter,
} from '../../../features/games/genres';

const GENRE_FILTER_MENU_ID = 'game-genre-filter-menu';

type MainGenreFilterProps = {
  selectedGenre: GameGenreFilter;
  onSelectGenre: (genre: GameGenreFilter) => void;
};

const MainGenreFilter = ({
  selectedGenre,
  onSelectGenre,
}: MainGenreFilterProps) => {
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

export default MainGenreFilter;
