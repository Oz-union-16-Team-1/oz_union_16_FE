import { Heart } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import AuthButton from '../../../components/auth/AuthButton';
import ConfirmModal from '../../../components/mypage/ConfirmModal';
import FavoriteGameCard from '../../../components/mypage/FavoriteGameCard';
import FavoriteGameCardSkeleton from '../../../components/mypage/FavoriteGameCardSkeleton';
import FavoriteGamesEmptyState from '../../../components/mypage/FavoriteGamesEmptyState';
import { extractAuthApiErrorMessage } from '../../../features/auth/api/auth';
import {
  DEFAULT_LIKED_GAMES_PAGE_SIZE,
  useLikedGamesInfiniteQuery,
  useUnlikeLikedGameMutation,
} from '../../../features/auth/api/useAuthApi';
import type { GameListItem } from '../../../features/games/types';
import type { FavoriteGamePreview } from '../../../features/mypage/types';
import type { LikedGameItemResponse } from '../../../features/auth/types/auth';
import type { MyPageToastPayload } from '../types';
import { toFavoriteGameListItem, toFavoriteGamePreview } from '../utils';

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
  const likedGamesQuery = useLikedGamesInfiniteQuery(
    enabled,
    DEFAULT_LIKED_GAMES_PAGE_SIZE,
  );
  const unlikeLikedGameMutation = useUnlikeLikedGameMutation();
  const [selectedFavoriteGame, setSelectedFavoriteGame] =
    useState<FavoriteGamePreview | null>(null);
  const favoriteGamesScrollRef = useRef<HTMLDivElement | null>(null);
  const favoriteGamesLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const likedGameResults = useMemo(() => {
    const pages = likedGamesQuery.data?.pages ?? [];

    return pages.flatMap((page) => page.results);
  }, [likedGamesQuery.data]);
  const favoriteGames = useMemo(() => {
    const deduplicatedGames = new Map<number, LikedGameItemResponse>();

    likedGameResults.forEach((game) => {
      deduplicatedGames.set(game.game_id, game);
    });

    return [...deduplicatedGames.values()].map(toFavoriteGamePreview);
  }, [likedGameResults]);
  const hasFavoriteGamesNextPage = Boolean(likedGamesQuery.hasNextPage);
  const isFavoriteGamesFetchNextPageError =
    likedGamesQuery.isFetchNextPageError;
  const isFavoriteGamesFetchingNextPage = likedGamesQuery.isFetchingNextPage;
  const fetchNextFavoriteGamesPage = likedGamesQuery.fetchNextPage;
  const favoriteCount =
    likedGamesQuery.data?.pages?.[0]?.count ?? favoriteGames.length;
  const isFavoriteGamesLoading =
    likedGamesQuery.isLoading && !favoriteGames.length;
  const isFavoriteGamesError = likedGamesQuery.isError && !favoriteGames.length;

  useEffect(() => {
    if (isFavoriteGamesFetchNextPageError || !hasFavoriteGamesNextPage) {
      return undefined;
    }

    const rootElement = favoriteGamesScrollRef.current;
    const targetElement = favoriteGamesLoadMoreRef.current;

    if (!rootElement || !targetElement) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting || isFavoriteGamesFetchingNextPage) {
          return;
        }

        void fetchNextFavoriteGamesPage();
      },
      {
        root: rootElement,
        rootMargin: '0px 0px 160px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [
    favoriteGames.length,
    fetchNextFavoriteGamesPage,
    hasFavoriteGamesNextPage,
    isFavoriteGamesFetchNextPageError,
    isFavoriteGamesFetchingNextPage,
  ]);

  const handleFavoriteGameCardClick = (game: FavoriteGamePreview) => {
    onOpenGameDetail(toFavoriteGameListItem(game));
  };

  const handleFavoriteGameDeleteConfirm = async () => {
    if (!selectedFavoriteGame) {
      return;
    }

    try {
      const response = await unlikeLikedGameMutation.mutateAsync(
        selectedFavoriteGame.gameId,
      );

      setSelectedFavoriteGame(null);
      onToast({
        tone: 'success',
        message: response.detail || '찜한 게임이 목록에서 삭제되었습니다.',
      });
    } catch (error) {
      onToast({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
    }
  };

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
                {likedGamesQuery.isFetchNextPageError ? (
                  <>
                    <p className="text-sm text-red-300">
                      추가 찜 목록을 불러오지 못했습니다.
                    </p>
                    <AuthButton
                      type="button"
                      variant="secondary"
                      className="w-full max-w-40"
                      onClick={() => void likedGamesQuery.fetchNextPage()}
                      disabled={likedGamesQuery.isFetchingNextPage}
                    >
                      {likedGamesQuery.isFetchingNextPage
                        ? '다시 불러오는 중...'
                        : '다시 시도'}
                    </AuthButton>
                  </>
                ) : likedGamesQuery.isFetchingNextPage ? (
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
                onClick={() => void likedGamesQuery.refetch()}
                disabled={
                  likedGamesQuery.isFetching ||
                  likedGamesQuery.isFetchingNextPage
                }
              >
                {likedGamesQuery.isFetching ||
                likedGamesQuery.isFetchingNextPage
                  ? '다시 불러오는 중...'
                  : '다시 시도'}
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
        isPending={unlikeLikedGameMutation.isPending}
        onClose={() => setSelectedFavoriteGame(null)}
        onConfirm={() => {
          void handleFavoriteGameDeleteConfirm();
        }}
      />
    </>
  );
}

export default MyPageLikedGamesSection;
