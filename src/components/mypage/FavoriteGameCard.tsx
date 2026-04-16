import { Heart } from 'lucide-react';
import { Link } from 'react-router';

import type { FavoriteGamePreview } from '../../features/mypage/types';

type FavoriteGameCardProps = {
  game: FavoriteGamePreview;
};

function FavoriteGameCard({ game }: FavoriteGameCardProps) {
  return (
    <Link
      to={`/games/${game.gameId}`}
      className="group border-mypage-card bg-mypage-card shadow-mypage-float hover:bg-mypage-card-hover flex h-full flex-col overflow-hidden rounded-[24px] border transition duration-200"
    >
      <div className="bg-mypage-soft relative aspect-[16/10] overflow-hidden">
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={`${game.title} 썸네일`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="text-mypage-muted flex h-full items-center justify-center px-6 text-center text-sm">
            이미지 준비 중
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex justify-end p-3">
          <span className="bg-login-primary inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_12px_28px_rgba(242,15,23,0.25)]">
            <Heart size={16} fill="currentColor" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-4 sm:px-5">
        <h3 className="text-lg/7 font-semibold text-white">{game.title}</h3>
        <p className="text-mypage-muted text-sm/6">{game.summary}</p>
      </div>
    </Link>
  );
}

export default FavoriteGameCard;
