import { Star } from 'lucide-react';

import type { MatchingRatingValue } from '../types';

type MatchingRatingStarsProps = {
  value: MatchingRatingValue | null;
  onRate: (rating: MatchingRatingValue) => void;
};

const ratingValues: MatchingRatingValue[] = [1, 2, 3, 4, 5];

function MatchingRatingStars({ value, onRate }: MatchingRatingStarsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {ratingValues.map((ratingValue) => {
        const isActive = value !== null && ratingValue <= value;

        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onRate(ratingValue)}
            aria-label={`${ratingValue}점 선택`}
            aria-pressed={value === ratingValue}
            className={`flex h-9.5 w-9.5 items-center justify-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d93737] ${
              isActive
                ? 'border-[#c12626]/70 bg-[#220b0b] text-[#f25a5a]'
                : 'border-white/10 bg-white/3 text-white/34 hover:border-white/18 hover:text-white/72'
            }`}
          >
            <Star
              size={20}
              fill={isActive ? 'currentColor' : 'none'}
              className={isActive ? '' : 'stroke-[1.9px]'}
            />
          </button>
        );
      })}
    </div>
  );
}

export default MatchingRatingStars;
