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
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`
        : null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const videoId = url.searchParams.get('v');

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`
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
  const candidateSummary =
    candidate.description?.trim() ||
    `${genreTitle} 흐름에서 ${candidate.title}은 ${candidate.genres.join(
      ' · ',
    )} 감각을 대표하는 후보예요. 영상과 이미지를 보고 취향에 얼마나 맞는지 편하게 판단해보세요.`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[26px] border border-white/8 bg-[#0d0d0f] shadow-[0_24px_48px_rgba(0,0,0,0.28)]">
      <div className="relative aspect-[16/8.6] shrink-0">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${candidate.title} 트레일러`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={candidate.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#111113] text-sm text-white/45">
            미디어가 준비되지 않았습니다.
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-white/8 bg-[linear-gradient(180deg,rgba(18,18,20,0.94),rgba(11,11,12,0.98))] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#f06b6b] uppercase">
            이 카드에서 볼 포인트
          </p>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/52">
            {stepLabel}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 break-keep text-white/62">
          {candidateSummary}
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-3.5">
            <p className="text-[10px] font-medium tracking-[0.18em] text-white/34 uppercase">
              평균 평점
            </p>
            <p className="mt-1.5 text-lg font-semibold text-white">
              {candidate.rating?.toFixed(1) ?? 'N/A'}
            </p>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-3.5">
            <p className="text-[10px] font-medium tracking-[0.18em] text-white/34 uppercase">
              미디어
            </p>
            <p className="mt-1.5 text-sm font-medium text-white/78">
              {candidate.trailer_url ? '트레일러 제공' : '이미지 미리보기'}
            </p>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-3.5">
            <p className="text-[10px] font-medium tracking-[0.18em] text-white/34 uppercase">
              장르 감각
            </p>
            <p className="mt-1.5 text-sm font-medium text-white/78">
              {candidate.genres[0] ?? genreTitle}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default MatchingMediaPanel;
