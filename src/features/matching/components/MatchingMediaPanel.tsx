import { PlayCircle } from 'lucide-react';

import type { MatchingCandidateItem } from '../types';

type MatchingMediaPanelProps = {
  candidate: MatchingCandidateItem;
  genreTitle: string;
  stepLabel: string;
};

const getYoutubeEmbedUrl = (trailerUrl: string | null) => {
  if (!trailerUrl) {
    return null;
  }

  try {
    const url = new URL(trailerUrl);
    const hostname = url.hostname.replace('www.', '');

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.replace('/', '');

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
        : null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const videoId = url.searchParams.get('v');

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
        : null;
    }
  } catch {
    return null;
  }

  return null;
};

function MatchingMediaPanel({
  candidate,
  genreTitle,
  stepLabel,
}: MatchingMediaPanelProps) {
  const embedUrl = getYoutubeEmbedUrl(candidate.trailer_url);
  const imageUrl = candidate.thumbnail_url;
  const candidateSummary = `${genreTitle} 흐름에서 ${candidate.title}은 ${candidate.genres.join(
    ' · ',
  )} 감각을 대표하는 후보예요. 영상과 이미지를 보고 취향에 얼마나 맞는지 편하게 판단해보세요.`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#0d0d0f] shadow-[0_26px_52px_rgba(0,0,0,0.28)]">
      <div className="relative shrink-0">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${candidate.title} 트레일러`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-[16/9] w-full border-0"
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={candidate.title}
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-[#111113] text-sm text-white/45">
            미디어가 준비되지 않았습니다.
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.12),rgba(8,8,10,0.78))]" />
        <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase">
            <span className="rounded-full border border-white/12 bg-black/24 px-3 py-1.5 text-white/70">
              {genreTitle}
            </span>
            {candidate.trailer_url ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#972020]/30 bg-[#180a0a] px-3 py-1.5 text-[#f07272]">
                <PlayCircle size={12} />
                Trailer
              </span>
            ) : null}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-[40px]">
            {candidate.title}
          </h2>
          <p className="mt-3 text-sm leading-7 break-keep text-white/68 sm:text-base">
            {candidate.genres.join(' · ')}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col border-t border-white/8 bg-[linear-gradient(180deg,rgba(18,18,20,0.94),rgba(11,11,12,0.98))] px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#f06b6b] uppercase">
            이 카드에서 볼 포인트
          </p>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/52">
            {stepLabel}
          </span>
        </div>

        <p className="mt-4 text-sm leading-7 break-keep text-white/62">
          {candidateSummary}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] font-medium tracking-[0.18em] text-white/34 uppercase">
              평균 평점
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {candidate.rating?.toFixed(1) ?? 'N/A'}
            </p>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] font-medium tracking-[0.18em] text-white/34 uppercase">
              미디어
            </p>
            <p className="mt-2 text-sm font-medium text-white/78">
              {candidate.trailer_url ? '트레일러 제공' : '이미지 미리보기'}
            </p>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] font-medium tracking-[0.18em] text-white/34 uppercase">
              장르 감각
            </p>
            <p className="mt-2 text-sm font-medium text-white/78">
              {candidate.genres[0] ?? genreTitle}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default MatchingMediaPanel;
