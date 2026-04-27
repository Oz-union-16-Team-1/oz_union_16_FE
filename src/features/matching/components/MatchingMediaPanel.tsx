import type { MatchingCandidateItem } from '../types';

type MatchingMediaPanelProps = {
  candidate: MatchingCandidateItem;
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

function MatchingMediaPanel({ candidate }: MatchingMediaPanelProps) {
  const embedUrl = getYoutubeEmbedUrl(candidate.trailer_url);
  const imageUrl = candidate.thumbnail_url;

  return (
    <article className="h-full overflow-hidden rounded-[26px] border border-white/8 bg-[#0d0d0f] shadow-[0_24px_48px_rgba(0,0,0,0.28)]">
      <div className="relative h-full min-h-[360px] sm:min-h-[420px]">
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
    </article>
  );
}

export default MatchingMediaPanel;
