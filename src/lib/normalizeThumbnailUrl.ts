import { apiBaseUrl } from './env';

const INVALID_THUMBNAIL_URL_VALUES = new Set([
  'n/a',
  'null',
  'undefined',
  'none',
]);
const IGDB_IMAGE_ID_REGEX = /^co[a-z0-9]+$/i;
const IGDB_IMAGE_BASE_URL = 'https://images.igdb.com/igdb/image/upload';
const IGDB_COVER_SIZE = 't_cover_big';

const resolveThumbnailBaseUrl = () =>
  apiBaseUrl ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

export const isIgdbImageId = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();

  return Boolean(trimmedValue && IGDB_IMAGE_ID_REGEX.test(trimmedValue));
};

type NormalizeThumbnailUrlOptions = {
  igdbExtension?: 'jpg' | 'png';
};

export const normalizeThumbnailUrl = (
  value: string | null | undefined,
  options: NormalizeThumbnailUrlOptions = {},
) => {
  const { igdbExtension = 'jpg' } = options;
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  if (INVALID_THUMBNAIL_URL_VALUES.has(trimmedValue.toLowerCase())) {
    return null;
  }

  if (isIgdbImageId(trimmedValue)) {
    return `${IGDB_IMAGE_BASE_URL}/${IGDB_COVER_SIZE}/${trimmedValue}.${igdbExtension}`;
  }

  if (trimmedValue.startsWith('//')) {
    return `https:${trimmedValue}`;
  }

  if (trimmedValue.startsWith('images.igdb.com/')) {
    return `https://${trimmedValue}`;
  }

  try {
    return new URL(trimmedValue, resolveThumbnailBaseUrl()).toString();
  } catch {
    return null;
  }
};
