import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ExternalLink, Heart, PlayCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ToastMessage from '../../../components/mypage/ToastMessage';
import type { LikedGamesResponse } from '../../auth/types/auth';
import { useAuthStore } from '../../../store/useAuthStore';
import { getGameDetail, likeGame, unlikeGame } from '../gameApi';
import type { GameDetail, GameListItem } from '../types';

type GameDetailModalProps = {
  game: GameListItem;
  onClose: () => void;
};

const EXTERNAL_LINK_LABELS: Array<{
  key: keyof GameDetail['externalLinks'];
  label: string;
}> = [
  { key: 'officialSite', label: '공식 사이트' },
  { key: 'steam', label: 'Steam' },
  { key: 'epicStore', label: 'Epic Games' },
];

const formatDetailRating = (rating: number | null) =>
  typeof rating === 'number' ? rating.toFixed(1) : 'N/A';

const formatNullableText = (value: string | null | undefined) =>
  value?.trim() ? value : 'N/A';

const LOGIN_REQUIRED_MESSAGE = '로그인 후 찜하기를 사용할 수 있어요.';
const LIKE_ERROR_MESSAGE =
  '찜하기 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const DETAIL_NOT_FOUND_TITLE = '게임 상세 정보 없음';
const DETAIL_NOT_FOUND_MESSAGE = '해당 게임 상세 정보를 찾을 수 없습니다.';
const TOAST_DURATION_MS = 3000;

const getLikeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return LOGIN_REQUIRED_MESSAGE;
    }

    if (error.response?.status === 404) {
      return DETAIL_NOT_FOUND_MESSAGE;
    }
  }

  return LIKE_ERROR_MESSAGE;
};

const GameDetailModal = ({ game, onClose }: GameDetailModalProps) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [likeState, setLikeState] = useState<{
    gameId: number;
    isLiked: boolean | null;
    likeCount: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'error';
  } | null>(null);
  const [failedImageUrlsByGameId, setFailedImageUrlsByGameId] = useState<
    Record<number, string[]>
  >({});

  const detailQuery = useQuery({
    queryKey: ['games', 'detail', game.gameId],
    queryFn: () => getGameDetail(game.gameId),
    staleTime: 60_000,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: (nextLiked: boolean) =>
      nextLiked ? likeGame(game.gameId) : unlikeGame(game.gameId),
    onMutate: () => {
      setToast(null);
    },
    onSuccess: (response) => {
      const nextLikeState = {
        gameId: response.gameId,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
      };

      setLikeState(nextLikeState);
      queryClient.setQueryData<GameDetail>(
        ['games', 'detail', game.gameId],
        (currentDetail) =>
          currentDetail
            ? {
                ...currentDetail,
                isLiked: response.isLiked,
                likeCount: response.likeCount,
              }
            : currentDetail,
      );

      queryClient.setQueriesData<LikedGamesResponse>(
        { queryKey: ['auth', 'me', 'game-like'] },
        (current) => {
          if (!current) {
            return current;
          }

          if (response.isLiked) {
            const alreadyExists = current.results.some(
              (likedGame) => likedGame.game_id === response.gameId,
            );

            if (alreadyExists) {
              return current;
            }

            const nextLikedGame = {
              game_id: response.gameId,
              game_title: (detail?.title ?? game.name).trim() || 'N/A',
              thumbnail_url: detail?.coverImageUrl ?? game.thumbnailUrl,
              genres: detail?.genres?.length ? detail.genres : game.genres,
              liked_at: new Date().toISOString(),
            };

            return {
              ...current,
              count: current.count + 1,
              results: [nextLikedGame, ...current.results],
            };
          }

          const nextResults = current.results.filter(
            (likedGame) => likedGame.game_id !== response.gameId,
          );

          if (nextResults.length === current.results.length) {
            return current;
          }

          return {
            ...current,
            count: Math.max(0, current.count - 1),
            results: nextResults,
          };
        },
      );
      void queryClient.invalidateQueries({
        queryKey: ['auth', 'me', 'game-like'],
      });
    },
    onError: (error) => {
      setToast({
        message: getLikeErrorMessage(error),
        tone: 'error',
      });
    },
  });

  const detail = detailQuery.data;
  const title = detail?.title ?? game.name;
  const genres = detail?.genres.length ? detail.genres : game.genres;
  const genreLabel = genres.length > 0 ? genres.join(', ') : 'N/A';
  const activeLikeState = likeState?.gameId === game.gameId ? likeState : null;
  const currentLiked =
    activeLikeState?.isLiked ??
    detail?.isLiked ??
    (typeof game.isLiked === 'boolean' ? game.isLiked : null);
  const isLiked = currentLiked === true;
  const likeLabel = isLiked ? '찜하기 취소' : '찜하기';
  const likeCount = Math.max(
    0,
    activeLikeState?.likeCount ?? detail?.likeCount ?? 0,
  );
  const hasAccessToken = Boolean(accessToken);
  const failedImageUrls = failedImageUrlsByGameId[game.gameId] ?? [];
  const imageCandidates = [detail?.coverImageUrl, game.thumbnailUrl].filter(
    (url): url is string => Boolean(url),
  );
  const imageUrl =
    imageCandidates.find((url) => !failedImageUrls.includes(url)) ?? null;
  const detailRows = [
    { label: '게임 출시일', value: formatNullableText(detail?.releaseDate) },
    { label: '게임 개발사', value: formatNullableText(detail?.developer) },
    { label: '게임 배급사', value: formatNullableText(detail?.publisher) },
  ];
  const externalLinks = EXTERNAL_LINK_LABELS.map(({ key, label }) => ({
    label,
    url: detail?.externalLinks[key],
  })).filter((link): link is { label: string; url: string } =>
    Boolean(link.url?.trim() && link.url.trim() !== 'N/A'),
  );

  const handleToggleLike = () => {
    if (!hasAccessToken) {
      setToast({
        message: LOGIN_REQUIRED_MESSAGE,
        tone: 'error',
      });
      return;
    }

    likeMutation.mutate(!isLiked);
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {toast ? (
        <ToastMessage
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
          variant="absoluteTopCenter"
        />
      ) : null}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-detail-modal-title"
        className="game-detail-modal-scrollbar bg-auth-panel relative max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-lg border border-[#5a1115]/80 text-white shadow-[0_0_48px_rgba(210,11,18,0.22)] sm:max-h-[calc(100dvh-3rem)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="상세 모달 닫기"
          className="absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-black/45 text-white/80 transition hover:border-[#d20b12]/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>

        {detailQuery.isError ? (
          <div className="flex min-h-96 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
            <h2
              id="game-detail-modal-title"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              {DETAIL_NOT_FOUND_TITLE}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">
              {DETAIL_NOT_FOUND_MESSAGE}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 px-5 pt-5 pb-6 sm:grid-cols-[216px_minmax(0,1fr)] sm:px-7 sm:pt-7">
              <div className="relative isolate aspect-4/5 w-[min(56vw,13.5rem)] max-w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] sm:w-54">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`${title} 커버 이미지`}
                    className="relative z-0 h-full w-full object-cover"
                    onError={() => {
                      setFailedImageUrlsByGameId((current) => {
                        const currentUrls = current[game.gameId] ?? [];

                        if (currentUrls.includes(imageUrl)) {
                          return current;
                        }

                        return {
                          ...current,
                          [game.gameId]: [...currentUrls, imageUrl],
                        };
                      });
                    }}
                  />
                ) : (
                  <div className="relative z-0 flex h-full w-full items-center justify-center text-xs text-white/45">
                    이미지 N/A
                  </div>
                )}
              </div>

              <div className="min-w-0 sm:pr-12">
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 pr-10 sm:items-center sm:pr-0">
                  <h2
                    id="game-detail-modal-title"
                    className="min-w-0 truncate text-2xl leading-tight font-bold sm:text-3xl"
                    title={title}
                  >
                    {title}
                  </h2>
                  <button
                    type="button"
                    aria-label={likeLabel}
                    aria-pressed={isLiked}
                    aria-disabled={likeMutation.isPending}
                    title={likeLabel}
                    disabled={likeMutation.isPending}
                    onClick={handleToggleLike}
                    className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12] disabled:cursor-wait disabled:opacity-70 ${
                      isLiked
                        ? 'border-[#ff4b55]/60 bg-[#251010] text-white hover:border-[#ff4b55]/90 hover:bg-[#2d1113]'
                        : 'border-white/15 bg-white/4 text-white/78 hover:border-[#ff4b55]/60 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Heart
                      aria-hidden="true"
                      className={`h-4.5 w-4.5 transition ${
                        isLiked
                          ? 'fill-current text-[#ff4b55]'
                          : 'fill-transparent text-[#ff4b55]'
                      }`}
                    />
                    <span>찜하기</span>
                  </button>
                </div>
                <p className="mt-3 text-sm text-white/65">{genreLabel}</p>
                <p className="mt-2 text-sm text-white/70">
                  평점{' '}
                  <span className="font-semibold text-[#ff4b55]">
                    {formatDetailRating(game.rating)}
                  </span>
                  <span className="mx-2 text-white/24">|</span>
                  좋아요{' '}
                  <span className="font-semibold text-white/86">
                    {likeCount.toLocaleString('ko-KR')}
                  </span>
                </p>
                <p className="mt-5 line-clamp-5 text-sm leading-6 text-white/60 sm:line-clamp-6">
                  {detailQuery.isLoading
                    ? '상세 정보를 불러오는 중입니다.'
                    : formatNullableText(detail?.description)}
                </p>
              </div>
            </div>

            <div className="px-5 pb-6 sm:px-7 sm:pb-7">
              <div className="flex aspect-video min-h-44 items-center justify-center overflow-hidden rounded-lg border border-[#5a1115]/70 bg-[#2a1711] shadow-[inset_0_0_42px_rgba(255,75,85,0.08)] sm:min-h-72">
                <div className="px-4 text-center">
                  <PlayCircle
                    aria-hidden="true"
                    className="mx-auto h-12 w-12 text-white/55 sm:h-16 sm:w-16"
                  />
                  <p className="mt-4 text-sm font-semibold text-white/75 sm:text-base">
                    프로모션 동영상 영역
                  </p>
                  <p className="mt-2 text-xs text-white/45 sm:text-sm">
                    영상 URL 정책이 확정되면 이 영역에 iframe을 연결합니다.
                  </p>
                </div>
              </div>

              <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {detailRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid gap-1 py-4 text-sm sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4"
                  >
                    <dt className="text-white/65">{row.label}</dt>
                    <dd className="text-white/80">{row.value}</dd>
                  </div>
                ))}
                <div className="grid items-center gap-3 py-4 text-sm sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-white/65">외부 링크</dt>
                  <dd className="text-white/80">
                    {externalLinks.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {externalLinks.map((link) => (
                          <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/12 bg-white/4 px-3 text-sm font-semibold text-white/78 transition hover:border-[#ff4b55]/50 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]"
                          >
                            <span>{link.label}</span>
                            <ExternalLink
                              aria-hidden="true"
                              className="h-3.5 w-3.5"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default GameDetailModal;
