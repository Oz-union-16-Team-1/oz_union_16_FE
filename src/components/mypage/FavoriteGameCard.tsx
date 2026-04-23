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
    <article className="group border-mypage-card bg-mypage-card shadow-mypage-float hover:bg-mypage-card-hover flex h-full flex-col overflow-hidden rounded-[22px] border transition duration-200">
      <div className="bg-mypage-soft relative aspect-[3/4] overflow-hidden">
        <button
          type="button"
          onClick={() => onClick?.(game)}
          className="block h-full w-full text-left"
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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
        </button>
        <div className="absolute top-3 right-3">
          <ActionButton
            type="button"
            variant="icon"
            aria-label={`${game.title} 찜 해제`}
            onClick={() => onFavoriteClick?.(game)}
            className="hover:!border-login-primary hover:!bg-login-primary-hover !border-login-primary !bg-login-primary !text-white shadow-[0_10px_24px_rgba(0,0,0,0.38)] hover:!text-white focus-visible:ring-red-300/45"
          >
            <X size={15} strokeWidth={2.25} />
          </ActionButton>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onClick?.(game)}
        className="flex flex-1 flex-col gap-2 px-4 py-4 text-left"
      >
        <h3 className="line-clamp-1 text-base/6 font-semibold text-white sm:text-lg/7">
          {game.title}
        </h3>
        <p className="text-mypage-muted line-clamp-1 text-xs/5 sm:text-sm/6">
          {game.summary}
        </p>
      </button>
    </article>
  );
}

export default FavoriteGameCard;
