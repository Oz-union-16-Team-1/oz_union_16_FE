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
    favoriteGamesScrollRef,
    favoriteGamesLoadMoreRef,
    favoriteGames,
    favoriteCount,
    isFavoriteGamesLoading,
    isFavoriteGamesError,
    hasFavoriteGamesNextPage,
    isFavoriteGamesFetchingNextPage,
    isFavoriteGamesFetchNextPageError,
    isFetchingFavoriteGames,
    selectedFavoriteGame,
    isUnlikePending,
    setSelectedFavoriteGame,
    handleFavoriteGameCardClick,
    handleFavoriteGameDeleteConfirm,
    refetchFavoriteGames,
    fetchNextFavoriteGamesPage,
  } = useMyPageLikedGames({
    enabled,
    onOpenGameDetail,
    onToast,
  });

  return (
    <>
      <section className="bg-mypage-panel border-mypage-panel shadow-mypage-float mt-8 rounded-[28px] border px-4 py-5 backdrop-blur-xl sm:mt-10 sm:px-6 sm:py-6">
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
          <p className="text-mypage-muted text-sm">
            {isFavoriteGamesLoading
              ? '찜 목록을 불러오는 중입니다.'
              : favoriteCount > 0
                ? `총 ${favoriteCount}개의 게임이 저장되어 있어요`
                : '아직 저장된 게임이 없어요'}
          </p>
        </div>

        <div
          ref={favoriteGamesScrollRef}
          className="mypage-scrollbar mt-5 h-[23rem] overflow-y-auto pr-1 sm:h-[25rem] lg:h-[25rem]"
        >
          {isFavoriteGamesLoading ? (
            <FavoriteGameCardSkeleton />
          ) : favoriteCount > 0 ? (
            <div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
                {favoriteGames.map((game) => (
                  <FavoriteGameCard
                    key={game.gameId}
                    game={game}
                    onClick={handleFavoriteGameCardClick}
                    onFavoriteClick={setSelectedFavoriteGame}
                  />
                ))}
              </div>
              <div className="mt-5 flex flex-col items-center gap-2">
                <div
                  ref={favoriteGamesLoadMoreRef}
                  aria-hidden="true"
                  className="h-0.5 w-full"
                />
                {isFavoriteGamesFetchNextPageError ? (
                  <>
                    <p className="text-sm text-red-300">
                      추가 찜 목록을 불러오지 못했습니다.
                    </p>
                    <AuthButton
                      type="button"
                      variant="secondary"
                      className="w-full max-w-40"
                      onClick={() => void fetchNextFavoriteGamesPage()}
                      disabled={isFavoriteGamesFetchingNextPage}
                    >
                      {isFavoriteGamesFetchingNextPage
                        ? '다시 불러오는 중...'
                        : '다시 시도'}
                    </AuthButton>
                  </>
                ) : isFavoriteGamesFetchingNextPage ? (
                  <p className="text-mypage-muted text-sm">
                    찜 목록을 더 불러오는 중입니다...
                  </p>
                ) : hasFavoriteGamesNextPage ? (
                  <p className="text-mypage-muted text-sm">
                    아래로 스크롤하면 찜 목록을 더 볼 수 있어요.
                  </p>
                ) : null}
              </div>
            </div>
          ) : isFavoriteGamesError ? (
            <div
              role="status"
              aria-live="polite"
              className="border-mypage-divider bg-mypage-card flex min-h-56 flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed px-6 py-10 text-center"
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
        onClose={() => setSelectedFavoriteGame(null)}
        onConfirm={() => {
          void handleFavoriteGameDeleteConfirm();
        }}
      />
    </>
  );
}

export default MyPageLikedGamesSection;
