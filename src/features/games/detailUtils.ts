import type { GameDetail } from './types';

export const DETAIL_LOADING_TEXT = '불러오는 중';

/** 게임 상세 데이터를 신선(fresh)으로 간주하는 시간 */
export const GAME_DETAIL_STALE_TIME = 1000 * 60 * 5; // 5분

/** 비활성 상태의 게임 상세 캐시를 GC하기까지 대기 시간 */
export const GAME_DETAIL_GC_TIME = 1000 * 60 * 30; // 30분

const hasMeaningfulText = (
  value: string | null | undefined,
): value is string => {
  const trimmedValue = value?.trim();

  return Boolean(trimmedValue && trimmedValue !== 'N/A');
};

export const normalizeMeaningfulText = (value: string | null | undefined) =>
  hasMeaningfulText(value) ? value.trim() : null;

export const normalizeMeaningfulTextList = (
  values: string[] | null | undefined,
) =>
  Array.isArray(values)
    ? values
        .map((value) => normalizeMeaningfulText(value))
        .filter((value): value is string => Boolean(value))
    : [];

const resolveStableLikeCount = (
  previousDetail: GameDetail | null,
  incomingDetail: GameDetail,
) => {
  // Some detail responses arrive without stable like metadata.
  // Keep the previous count unless the new payload clearly resolves it.
  if (incomingDetail.likeCount > 0 || incomingDetail.isLiked !== null) {
    return incomingDetail.likeCount;
  }

  return previousDetail?.likeCount ?? incomingDetail.likeCount;
};

export const mergeGameDetail = (
  previousDetail: GameDetail | null,
  incomingDetail: GameDetail,
): GameDetail => {
  const incomingGenres = normalizeMeaningfulTextList(incomingDetail.genres);
  const previousGenres = normalizeMeaningfulTextList(previousDetail?.genres);

  return {
    ...incomingDetail,
    title:
      normalizeMeaningfulText(incomingDetail.title) ??
      normalizeMeaningfulText(previousDetail?.title) ??
      'N/A',
    genres:
      incomingGenres.length > 0
        ? incomingGenres
        : previousGenres.length > 0
          ? previousGenres
          : ['N/A'],
    releaseDate:
      normalizeMeaningfulText(incomingDetail.releaseDate) ??
      normalizeMeaningfulText(previousDetail?.releaseDate),
    developer:
      normalizeMeaningfulText(incomingDetail.developer) ??
      normalizeMeaningfulText(previousDetail?.developer),
    publisher:
      normalizeMeaningfulText(incomingDetail.publisher) ??
      normalizeMeaningfulText(previousDetail?.publisher),
    promoVideoUrl:
      normalizeMeaningfulText(incomingDetail.promoVideoUrl) ??
      normalizeMeaningfulText(previousDetail?.promoVideoUrl),
    promoEmbedUrl:
      normalizeMeaningfulText(incomingDetail.promoEmbedUrl) ??
      normalizeMeaningfulText(previousDetail?.promoEmbedUrl),
    coverImageUrl:
      normalizeMeaningfulText(incomingDetail.coverImageUrl) ??
      normalizeMeaningfulText(previousDetail?.coverImageUrl),
    description:
      normalizeMeaningfulText(incomingDetail.description) ??
      normalizeMeaningfulText(previousDetail?.description),
    externalLinks: {
      officialSite:
        normalizeMeaningfulText(incomingDetail.externalLinks.officialSite) ??
        normalizeMeaningfulText(previousDetail?.externalLinks.officialSite),
      steam:
        normalizeMeaningfulText(incomingDetail.externalLinks.steam) ??
        normalizeMeaningfulText(previousDetail?.externalLinks.steam),
      epicStore:
        normalizeMeaningfulText(incomingDetail.externalLinks.epicStore) ??
        normalizeMeaningfulText(previousDetail?.externalLinks.epicStore),
    },
    isLiked:
      typeof incomingDetail.isLiked === 'boolean'
        ? incomingDetail.isLiked
        : (previousDetail?.isLiked ?? incomingDetail.isLiked),
    likeCount: resolveStableLikeCount(previousDetail, incomingDetail),
  };
};
