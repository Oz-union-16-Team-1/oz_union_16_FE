import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Heart, PlayCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGameDetail } from '../gameApi';
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

const getLikeCountAdjustment = ({
  isLiked,
  sourceLiked,
}: {
  isLiked: boolean;
  sourceLiked: boolean;
}) => {
  if (isLiked === sourceLiked) {
    return 0;
  }

  return isLiked ? 1 : -1;
};

const GameDetailModal = ({ game, onClose }: GameDetailModalProps) => {
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);

  const detailQuery = useQuery({
    queryKey: ['games', 'detail', game.gameId],
    queryFn: () => getGameDetail(game.gameId),
    staleTime: 60_000,
  });

  const detail = detailQuery.data;
  const title = detail?.title ?? game.name;
  const genres = detail?.genres.length ? detail.genres : game.genres;
  const genreLabel = genres.length > 0 ? genres.join(', ') : 'N/A';
  const sourceLiked = Boolean(detail?.isLiked ?? game.isLiked);
  const isLiked = likedOverride ?? sourceLiked;
  const likeLabel = isLiked ? '찜 해제' : '찜하기';
  const likeCountAdjustment = getLikeCountAdjustment({
    isLiked,
    sourceLiked,
  });
  const likeCount = Math.max(0, (detail?.likeCount ?? 0) + likeCountAdjustment);
  const imageCandidates = [detail?.coverImageUrl, game.thumbnailUrl].filter(
    (url): url is string => Boolean(url),
  );
  const imageUrl =
    imageCandidates.find((url) => !failedImageUrls.includes(url)) ?? null;
  const platformLabel = detail?.platforms.length
    ? detail.platforms.map((platform) => platform.name).join(', ')
    : 'N/A';
  const detailRows = [
    { label: '게임 출시일', value: formatNullableText(detail?.releaseDate) },
    { label: '게임 개발사', value: formatNullableText(detail?.developer) },
    { label: '게임 배급사', value: formatNullableText(detail?.publisher) },
    { label: '지원 플랫폼', value: platformLabel },
  ];
  const externalLinks = EXTERNAL_LINK_LABELS.map(({ key, label }) => ({
    label,
    url: detail?.externalLinks[key],
  })).filter((link): link is { label: string; url: string } =>
    Boolean(link.url && link.url !== 'N/A'),
  );
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
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-detail-modal-title"
        className="game-detail-modal-scrollbar relative max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-lg border border-[#5a1115]/80 bg-[#111111] text-white shadow-[0_0_48px_rgba(210,11,18,0.22)] sm:max-h-[calc(100dvh-3rem)]"
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

        <div className="grid gap-5 px-5 pt-5 pb-6 sm:grid-cols-[216px_minmax(0,1fr)] sm:px-7 sm:pt-7">
          <div className="relative isolate aspect-4/5 w-[min(56vw,13.5rem)] max-w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] sm:w-54">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${title} 커버 이미지`}
                className="relative z-0 h-full w-full object-cover"
                onError={() => {
                  setFailedImageUrls((current) =>
                    current.includes(imageUrl)
                      ? current
                      : [...current, imageUrl],
                  );
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
                title={likeLabel}
                onClick={() =>
                  setLikedOverride((current) => !(current ?? sourceLiked))
                }
                className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12] ${
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
      </section>
    </div>
  );
};

export default GameDetailModal;
