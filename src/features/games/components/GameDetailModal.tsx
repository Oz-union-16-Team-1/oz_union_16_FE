import { ExternalLink, Heart, PlayCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ToastMessage from '../../../components/mypage/ToastMessage';
import {
  DETAIL_LOADING_TEXT,
  normalizeMeaningfulText,
  normalizeMeaningfulTextList,
} from '../detailUtils';
import { useGameDetailModal } from '../hooks/useGameDetailModal';
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
  typeof rating === 'number' ? `${rating.toFixed(1)}점` : 'N/A';

const formatNullableText = (value: string | null | undefined) =>
  value?.trim() ? value : 'N/A';

const DETAIL_NOT_FOUND_TITLE = '게임 상세 정보 없음';
const DETAIL_NOT_FOUND_MESSAGE = '해당 게임 상세 정보를 찾을 수 없습니다.';
const DETAIL_FETCH_ERROR_MESSAGE =
  '상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
const DESCRIPTION_TOGGLE_MIN_LENGTH = 140;

const GameDetailModalSkeleton = ({ game }: { game: GameListItem }) => {
  const title = normalizeMeaningfulText(game.name) ?? 'N/A';
  const listGenres = normalizeMeaningfulTextList(game.genres);
  const genreLabel = listGenres.length > 0 ? listGenres.join(', ') : null;

  return (
    <>
      {/* 상단: 커버 이미지 + 기본 정보 */}
      <div className="grid gap-5 px-5 pt-5 pb-6 sm:grid-cols-[216px_minmax(0,1fr)] sm:px-7 sm:pt-7">
        {/* 커버 이미지: 리스트 썸네일로 즉시 표시 */}
        <div className="bg-header-button-border relative isolate aspect-4/5 w-[min(56vw,13.5rem)] max-w-full overflow-hidden rounded-lg border border-white/10 sm:w-54">
          {game.thumbnailUrl ? (
            <img
              src={game.thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover opacity-50"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-white/8" />
          )}
        </div>

        {/* 텍스트 영역 */}
        <div className="min-w-0 sm:pr-12">
          {/* 제목 (리스트에서 알고 있는 값) + 찜하기 버튼 스켈레톤 */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 pr-10 sm:items-center sm:pr-0">
            <h2
              id="game-detail-modal-title"
              className="min-w-0 truncate text-2xl leading-tight font-bold sm:text-3xl"
              title={title}
            >
              {title}
            </h2>
            <div className="h-10 w-18 shrink-0 animate-pulse rounded-md bg-white/8" />
          </div>

          {/* 장르: 리스트 값으로 즉시 표시, 없으면 스켈레톤 */}
          {genreLabel ? (
            <p className="mt-3 text-sm text-white/65">{genreLabel}</p>
          ) : (
            <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-white/8" />
          )}

          {/* 평점: 리스트에서 알고 있는 값 */}
          <p className="mt-2 text-sm text-white/70">
            평점 기준{' '}
            <span className="font-semibold text-[#ff4b55]">
              {typeof game.rating === 'number'
                ? `${game.rating.toFixed(1)}점`
                : 'N/A'}
            </span>
          </p>

          {/* 설명 스켈레톤 */}
          <div className="mt-5 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-white/8" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-white/8" />
          </div>
        </div>
      </div>

      {/* 하단: 영상 + 상세 정보 테이블 */}
      <div className="px-5 pb-6 sm:px-7 sm:pb-7">
        {/* 영상 영역 스켈레톤 */}
        <div className="aspect-video min-h-44 animate-pulse overflow-hidden rounded-lg border border-[#5a1115]/70 bg-[#2a1711] sm:min-h-72" />

        {/* 상세 정보 행 */}
        <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {['게임 출시일', '게임 개발사', '게임 배급사'].map((label) => (
            <div
              key={label}
              className="grid gap-1 py-4 text-sm sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4"
            >
              <dt className="text-white/65">{label}</dt>
              <dd>
                <div className="h-4 w-28 animate-pulse rounded bg-white/8" />
              </dd>
            </div>
          ))}
          <div className="grid items-center gap-3 py-4 text-sm sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-white/65">외부 링크</dt>
            <dd>
              <div className="flex flex-wrap gap-2">
                <div className="h-10 w-22 animate-pulse rounded-md bg-white/8" />
                <div className="h-10 w-14 animate-pulse rounded-md bg-white/8" />
                <div className="h-10 w-24 animate-pulse rounded-md bg-white/8" />
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
};

const toYouTubeEmbedUrl = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const resolveEmbedUrl = (
  embedUrl: string | null,
  videoUrl: string | null,
): string | null => embedUrl ?? (videoUrl ? toYouTubeEmbedUrl(videoUrl) : null);

const GameDetailModal = ({ game, onClose }: GameDetailModalProps) => {
  const [failedImageUrlsByGameId, setFailedImageUrlsByGameId] = useState<
    Record<number, string[]>
  >({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const {
    canRenderFallbackSummary,
    clearToast,
    detail,
    detailErrorKind,
    detailQuery,
    handleToggleLike,
    hasResolvedDetail,
    isLikePending,
    isLiked,
    likeCount,
    likeLabel,
    toast,
  } = useGameDetailModal(game);

  const detailTitle = normalizeMeaningfulText(detail?.title);
  const listTitle = normalizeMeaningfulText(game.name);
  const title = detailTitle ?? listTitle ?? 'N/A';
  const detailGenres = normalizeMeaningfulTextList(detail?.genres);
  const listGenres = normalizeMeaningfulTextList(game.genres);
  const genres =
    detailGenres.length > 0
      ? detailGenres
      : listGenres.length > 0
        ? listGenres
        : ['N/A'];
  const genreLabel = genres.length > 0 ? genres.join(', ') : 'N/A';
  const failedImageUrls = failedImageUrlsByGameId[game.gameId] ?? [];
  const imageCandidates = [detail?.coverImageUrl, game.thumbnailUrl].filter(
    (url): url is string => Boolean(url),
  );
  const imageUrl =
    imageCandidates.find((url) => !failedImageUrls.includes(url)) ?? null;
  const promoVideoUrl = detail?.promoVideoUrl?.trim() || null;
  const promoEmbedUrl = resolveEmbedUrl(
    detail?.promoEmbedUrl?.trim() || null,
    promoVideoUrl,
  );
  const isInitialDetailLoading = detailQuery.isPending && !hasResolvedDetail;
  const detailFieldFallback = isInitialDetailLoading
    ? DETAIL_LOADING_TEXT
    : 'N/A';
  const descriptionField =
    normalizeMeaningfulText(detail?.description) ?? detailFieldFallback;
  const descriptionText =
    descriptionField === DETAIL_LOADING_TEXT
      ? '상세 정보를 불러오는 중입니다.'
      : formatNullableText(descriptionField);
  const canToggleDescription =
    descriptionField !== DETAIL_LOADING_TEXT &&
    descriptionText !== 'N/A' &&
    (descriptionText.length >= DESCRIPTION_TOGGLE_MIN_LENGTH ||
      descriptionText.includes('\n'));
  const detailRows = [
    {
      label: '게임 출시일',
      value:
        normalizeMeaningfulText(detail?.releaseDate) ??
        (hasResolvedDetail ? 'N/A' : detailFieldFallback),
    },
    {
      label: '게임 개발사',
      value:
        normalizeMeaningfulText(detail?.developer) ??
        (hasResolvedDetail ? 'N/A' : detailFieldFallback),
    },
    {
      label: '게임 배급사',
      value:
        normalizeMeaningfulText(detail?.publisher) ??
        (hasResolvedDetail ? 'N/A' : detailFieldFallback),
    },
  ];
  const externalLinks = EXTERNAL_LINK_LABELS.map(({ key, label }) => ({
    label,
    url: detail?.externalLinks[key],
  })).filter((link): link is { label: string; url: string } =>
    Boolean(normalizeMeaningfulText(link.url)),
  );
  const shouldShowNotFoundState =
    detailErrorKind === 'not-found' &&
    !hasResolvedDetail &&
    !canRenderFallbackSummary;
  const shouldShowFatalErrorState =
    detailErrorKind === 'error' &&
    !hasResolvedDetail &&
    !canRenderFallbackSummary;
  const shouldShowErrorState =
    shouldShowNotFoundState || shouldShowFatalErrorState;

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
          onClose={clearToast}
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

        {detailQuery.isPending ? (
          <GameDetailModalSkeleton game={game} />
        ) : shouldShowErrorState ? (
          <div className="flex min-h-96 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
            <h2
              id="game-detail-modal-title"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              {shouldShowNotFoundState
                ? DETAIL_NOT_FOUND_TITLE
                : '상세 정보를 불러오지 못했습니다.'}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">
              {shouldShowNotFoundState
                ? DETAIL_NOT_FOUND_MESSAGE
                : DETAIL_FETCH_ERROR_MESSAGE}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 px-5 pt-5 pb-6 sm:grid-cols-[216px_minmax(0,1fr)] sm:px-7 sm:pt-7">
              <div className="bg-header-button-border relative isolate aspect-4/5 w-[min(56vw,13.5rem)] max-w-full overflow-hidden rounded-lg border border-white/10 sm:w-54">
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

              <div className="min-w-0 sm:flex sm:h-full sm:flex-col sm:pr-12">
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
                    aria-disabled={isLikePending}
                    title={likeLabel}
                    disabled={isLikePending}
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
                  평점 기준{' '}
                  <span className="font-semibold text-[#ff4b55]">
                    {formatDetailRating(game.rating)}
                  </span>
                  <span className="mx-2 text-white/24">|</span>
                  좋아요{' '}
                  <span className="font-semibold text-white/86">
                    {likeCount.toLocaleString('ko-KR')}
                  </span>
                </p>
                <div
                  className={`mt-5 sm:flex sm:flex-1 sm:flex-col ${canToggleDescription && !isDescriptionExpanded ? 'sm:relative' : ''}`}
                >
                  <div
                    className={`relative ${canToggleDescription && !isDescriptionExpanded ? 'sm:pr-0 sm:pb-7' : ''}`}
                  >
                    <p
                      className={`text-sm leading-6 text-white/60 transition-[max-height] duration-200 ease-out ${isDescriptionExpanded ? '' : 'line-clamp-5 sm:line-clamp-6'}`}
                    >
                      {descriptionText}
                    </p>
                    {canToggleDescription && !isDescriptionExpanded ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(180deg,rgba(12,12,14,0),rgba(12,12,14,0.92)_72%,rgba(12,12,14,1))]" />
                    ) : null}
                  </div>
                  {canToggleDescription ? (
                    <button
                      type="button"
                      aria-expanded={isDescriptionExpanded}
                      onClick={() =>
                        setIsDescriptionExpanded((current) => !current)
                      }
                      className={`mt-1 inline-flex cursor-pointer items-center text-sm font-semibold text-white/78 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12] ${
                        !isDescriptionExpanded
                          ? 'sm:absolute sm:bottom-0 sm:left-0'
                          : ''
                      }`}
                    >
                      {isDescriptionExpanded ? '줄거리 접기' : '줄거리 더보기'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="px-5 pb-6 sm:px-7 sm:pb-7">
              <div className="flex aspect-video min-h-44 items-center justify-center overflow-hidden rounded-lg border border-[#5a1115]/70 bg-[#2a1711] shadow-[inset_0_0_42px_rgba(255,75,85,0.08)] sm:min-h-72">
                {promoEmbedUrl ? (
                  <iframe
                    title={`${title} 프로모션 영상`}
                    src={promoEmbedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : promoVideoUrl ? (
                  <a
                    href={promoVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex h-full w-full flex-col items-center justify-center px-4 text-center transition hover:bg-black/10"
                  >
                    <PlayCircle
                      aria-hidden="true"
                      className="h-12 w-12 text-white/65 transition group-hover:scale-105 group-hover:text-white sm:h-16 sm:w-16"
                    />
                    <p className="mt-4 text-sm font-semibold text-white/80 sm:text-base">
                      프로모션 영상을 새 창에서 보기
                    </p>
                    <p className="mt-2 text-xs text-white/50 sm:text-sm">
                      {title} 관련 영상 페이지로 이동합니다.
                    </p>
                  </a>
                ) : hasResolvedDetail || detailQuery.isError ? (
                  <div className="px-4 text-center">
                    <PlayCircle
                      aria-hidden="true"
                      className="mx-auto h-12 w-12 text-white/55 sm:h-16 sm:w-16"
                    />
                    <p className="mt-4 text-sm font-semibold text-white/75 sm:text-base">
                      프로모션 영상 N/A
                    </p>
                    <p className="mt-2 text-xs text-white/45 sm:text-sm">
                      제공된 영상 정보가 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="px-4 text-center">
                    <PlayCircle
                      aria-hidden="true"
                      className="mx-auto h-12 w-12 text-white/55 sm:h-16 sm:w-16"
                    />
                    <p className="mt-4 text-sm font-semibold text-white/75 sm:text-base">
                      프로모션 영상을 불러오는 중입니다.
                    </p>
                    <p className="mt-2 text-xs text-white/45 sm:text-sm">
                      영상 정보를 확인하고 있습니다.
                    </p>
                  </div>
                )}
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
                    ) : hasResolvedDetail ? (
                      'N/A'
                    ) : (
                      detailFieldFallback
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
