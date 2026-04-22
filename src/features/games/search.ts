const SEARCH_WHITESPACE_REGEX = /\s+/g;
const SEARCH_NOISE_REGEX = /[\s\p{P}\p{S}]+/gu;

export type SearchKeyword = {
  normalized: string;
  collapsed: string;
  stripped: string;
};

export const normalizeSearchText = (value: string) =>
  value.normalize('NFKC').replace(SEARCH_WHITESPACE_REGEX, ' ').trim();

export const createSearchKeyword = (value: string): SearchKeyword => {
  const normalized = normalizeSearchText(value).toLowerCase();

  return {
    normalized,
    collapsed: normalized.replace(SEARCH_WHITESPACE_REGEX, ''),
    stripped: normalized.replace(SEARCH_NOISE_REGEX, ''),
  };
};
