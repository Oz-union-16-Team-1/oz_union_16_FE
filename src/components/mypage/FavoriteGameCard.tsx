import { X } from 'lucide-react';

import type { FavoriteGamePreview } from '../../features/mypage/types';
import ActionButton from '../common/ActionButton';

type FavoriteGameCardProps = {
  game: FavoriteGamePreview;
  onClick?: (game: FavoriteGamePreview) => void;
  onFavoriteClick?: (game: FavoriteGamePreview) => void;
};

function FavoriteGameCard({
  game,
  onClick,
  onFavoriteClick,
}: FavoriteGameCardProps) {
  return (
    <article className="group border-mypage-card bg-mypage-card shadow-mypage-float hover:bg-mypage-card-hover box-border flex h-[21rem] w-full min-w-0 flex-col overflow-hidden rounded-[22px] border transition duration-200 sm:h-[23rem] xl:h-[24rem]">
      <div className="bg-mypage-soft relative h-[15.75rem] overflow-hidden sm:h-[17.4rem] xl:h-[18.5rem]">
        <button
          type="button"
          onClick={() => onClick?.(game)}
          className="block h-full w-full cursor-pointer text-left"
        >
          {game.thumbnailUrl ? (
            <img
              src={game.thumbnailUrl}
              alt={`${game.title} 썸네일`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="text-mypage-muted flex h-full items-center justify-center px-6 text-center text-sm">
              이미지 준비 중
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 via-black/18 to-transparent" />
        </button>
        <div className="absolute top-3 right-3">
          <ActionButton
            type="button"
            variant="icon"
            aria-label={`${game.title} 찜 해제`}
            onClick={() => onFavoriteClick?.(game)}
            className="border-[#ff7a8c]/28! bg-[linear-gradient(145deg,rgba(169,38,60,0.96)_0%,rgba(112,19,37,0.98)_100%)] text-white! shadow-[0_12px_28px_rgba(53,7,18,0.46),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-[#ff9baa]/46! hover:bg-[linear-gradient(145deg,rgba(195,57,81,0.98)_0%,rgba(130,26,46,0.99)_100%)] hover:text-white! focus-visible:ring-[#ff96a5]/45"
          >
            <X size={14} strokeWidth={2.4} />
          </ActionButton>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onClick?.(game)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 px-3 py-2.5 text-left sm:px-4 sm:py-3"
      >
        <h3 className="line-clamp-1 text-sm/5 font-semibold text-white sm:text-base/6 lg:text-lg/7">
          {game.title}
        </h3>
        <p className="text-mypage-muted line-clamp-1 text-[11px]/4 sm:text-xs/5">
          {game.summary}
        </p>
      </button>
    </article>
  );
}

export default FavoriteGameCard;
