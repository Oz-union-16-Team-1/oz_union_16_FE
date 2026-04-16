import { HeartOff } from 'lucide-react';

function FavoriteGamesEmptyState() {
  return (
    <div className="border-mypage-divider bg-mypage-card flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-dashed px-6 py-10 text-center">
      <span className="bg-mypage-soft mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full text-white/80">
        <HeartOff size={24} />
      </span>
      <h3 className="text-xl font-semibold text-white">
        아직 찜한 게임이 없어요
      </h3>
      <p className="text-mypage-muted mt-3 max-w-md text-sm/6">
        마음에 드는 게임을 찜해두면 이곳에서 다시 빠르게 확인할 수 있습니다.
      </p>
    </div>
  );
}

export default FavoriteGamesEmptyState;
