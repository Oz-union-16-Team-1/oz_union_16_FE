import { Heart } from 'lucide-react';

import AuthButton from '../../../components/auth/AuthButton';
import ConfirmModal from '../../../components/mypage/ConfirmModal';
import FavoriteGameCard from '../../../components/mypage/FavoriteGameCard';
import FavoriteGameCardSkeleton from '../../../components/mypage/FavoriteGameCardSkeleton';
import FavoriteGamesEmptyState from '../../../components/mypage/FavoriteGamesEmptyState';
import type { GameListItem } from '../../../features/games/types';
import useMyPageLikedGames from '../hooks/useMyPageLikedGames';
import type { MyPageToastPayload } from '../types';

type MyPageLikedGamesSectionProps = {
  enabled: boolean;
  onOpenGameDetail: (game: GameListItem) => void;
  onToast: (toast: MyPageToastPayload) => void;
};

function MyPageLikedGamesSection({
  enabled,
  onOpenGameDetail,
  onToast,
}: MyPageLikedGamesSectionProps) {
  const {
    favoriteGames,
    favoriteCount,
    favoriteListRenderVersion,
    isFavoriteGamesLoading,
    isFavoriteGamesError,
    isFetchingFavoriteGames,
    selectedFavoriteGame,
    isUnlikePending,
    setSelectedFavoriteGame,
    handleFavoriteGameCardClick,
    handleFavoriteGameDeleteConfirm,
    refetchFavoriteGames,
  } = useMyPageLikedGames({
    enabled,
    onOpenGameDetail,
    onToast,
  });
  const safeFavoriteGames = Array.isArray(favoriteGames) ? favoriteGames : [];
  const hasFavoriteGames = safeFavoriteGames.length > 0;
  const listContainerClass = hasFavoriteGames
    ? 'mypage-scrollbar mt-5 max-w-full overflow-x-hidden overflow-y-auto pr-1 max-h-[38rem]'
    : 'mt-5 max-w-full';

  return (
    <>
      <section className="bg-mypage-panel border-mypage-panel shadow-mypage-float mt-8 box-border rounded-[28px] border px-4 py-5 backdrop-blur-xl sm:mt-10 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-mypage-accent-soft text-login-primary inline-flex h-11 w-11 items-center justify-center rounded-full">
              <Heart size={18} fill="currentColor" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">찜한 목록</h2>
              <p className="text-mypage-muted mt-1 text-sm/6">
                내가 저장한 게임들을 한눈에 다시 확인할 수 있어요.
              </p>
            </div>
          </div>
          {isFavoriteGamesLoading || favoriteCount > 0 ? (
            <p className="text-mypage-muted text-sm">
              {isFavoriteGamesLoading
                ? '찜 목록을 불러오는 중입니다.'
                : `총 ${favoriteCount}개의 게임이 저장되어 있어요`}
            </p>
          ) : null}
        </div>

        <div className={listContainerClass}>
          {isFavoriteGamesLoading ? (
            <FavoriteGameCardSkeleton />
          ) : hasFavoriteGames ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {safeFavoriteGames.map((game) => (
                <FavoriteGameCard
                  key={`${game.gameId}:${game.thumbnailUrl ?? 'none'}:${favoriteListRenderVersion}`}
                  game={game}
                  onClick={handleFavoriteGameCardClick}
                  onFavoriteClick={setSelectedFavoriteGame}
                />
              ))}
            </div>
          ) : isFavoriteGamesError ? (
            <div
              role="status"
              aria-live="polite"
              className="border-mypage-divider bg-mypage-card flex min-h-56 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed px-6 py-10 text-center"
            >
              <p className="text-sm text-red-300">
                찜 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </p>
              <AuthButton
                type="button"
                variant="secondary"
                className="w-full max-w-36"
                onClick={() => void refetchFavoriteGames()}
                disabled={isFetchingFavoriteGames}
              >
                {isFetchingFavoriteGames ? '다시 불러오는 중...' : '다시 시도'}
              </AuthButton>
            </div>
          ) : (
            <FavoriteGamesEmptyState />
          )}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(selectedFavoriteGame)}
        title="찜한 게임을 삭제할까요?"
        description={`'${selectedFavoriteGame?.title ?? ''}'을(를) 찜한 목록에서 삭제하시겠습니까?`}
        confirmLabel="예"
        cancelLabel="아니오"
        isPending={isUnlikePending}
        align="center"
        onClose={() => setSelectedFavoriteGame(null)}
        onConfirm={() => {
          void handleFavoriteGameDeleteConfirm();
        }}
      />
    </>
  );
}

export default MyPageLikedGamesSection;
