import { useState } from 'react';
import type { GameListItem } from '../types';
import {
  GAME_CARD_BODY_CLASS,
  GAME_CARD_MEDIA_CLASS,
  GAME_CARD_SHELL_CLASS,
} from './gameCardLayout';

type GameCardProps = {
  game: GameListItem;
  onSelectGame: (game: GameListItem) => void;
};

const formatRating = (rating: number | null) =>
  typeof rating === 'number' ? `${rating.toFixed(1)}점` : 'N/A';

const GameCard = ({ game, onSelectGame }: GameCardProps) => {
  const genreLabel = game.genres.length > 0 ? game.genres[0] : 'N/A';
  const [isImageUnavailable, setIsImageUnavailable] = useState(false);
  const thumbnailUrl = isImageUnavailable ? null : game.thumbnailUrl;

  return (
    <button
      type="button"
      onClick={() => onSelectGame(game)}
      className={`${GAME_CARD_SHELL_CLASS} group cursor-pointer snap-start scroll-ml-2 transition hover:border-[#d20b12]/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]`}
      aria-label={`${game.name} 상세 정보 열기`}
    >
      <div className={GAME_CARD_MEDIA_CLASS}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${game.name} 썸네일`}
            className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
            onError={() => setIsImageUnavailable(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-white/45">
            이미지 N/A
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div className={GAME_CARD_BODY_CLASS}>
        <div className="min-w-0">
          <h3 className="truncate text-base leading-7 font-medium sm:text-lg">
            {game.name}
          </h3>
          <p className="mt-1 truncate text-sm text-white/85 sm:text-base">
            {genreLabel}
          </p>
        </div>
        <span className="text-base font-medium whitespace-nowrap text-[#e10d15]">
          {formatRating(game.rating)}
        </span>
      </div>
    </button>
  );
};

export default GameCard;
