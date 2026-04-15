export const GAME_GENRE_FILTERS = [
  '전체',
  '액션',
  '어드벤처',
  'RPG',
  '슈팅',
  '전략',
  '시뮬레이션',
  '스포츠',
  '레이싱',
  '퍼즐',
  '플랫폼',
  '대전 / 격투',
  '카드 / 보드',
  '음악 / 리듬',
  '비주얼 노벨',
] as const;

export type GameGenreFilter = (typeof GAME_GENRE_FILTERS)[number];

const GENRE_ALIASES: Record<Exclude<GameGenreFilter, '전체'>, string[]> = {
  액션: ['액션', 'action'],
  어드벤처: ['어드벤처', 'adventure'],
  RPG: ['rpg'],
  슈팅: ['슈팅', 'shooter', 'shooting'],
  전략: ['전략', 'strategy'],
  시뮬레이션: ['시뮬레이션', 'simulation'],
  스포츠: ['스포츠', 'sports'],
  레이싱: ['레이싱', 'racing'],
  퍼즐: ['퍼즐', 'puzzle'],
  플랫폼: ['플랫폼', 'platform', 'metroidvania'],
  '대전 / 격투': ['대전', '격투', 'fighting'],
  '카드 / 보드': ['카드', '보드', 'card', 'board'],
  '음악 / 리듬': ['음악', '리듬', 'music', 'rhythm'],
  '비주얼 노벨': ['비주얼 노벨', 'visual novel'],
};

const normalizeGenreKeyword = (value: string) => value.trim().toLowerCase();

export const matchesGenreFilter = (
  genres: string[],
  selectedGenre: GameGenreFilter,
) => {
  if (selectedGenre === '전체') {
    return true;
  }

  const aliases = GENRE_ALIASES[selectedGenre].map(normalizeGenreKeyword);
  const gameGenres = genres.map(normalizeGenreKeyword);

  return gameGenres.some((genre) =>
    aliases.some((alias) => genre.includes(alias) || alias.includes(genre)),
  );
};
