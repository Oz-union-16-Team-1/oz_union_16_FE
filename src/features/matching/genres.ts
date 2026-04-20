import type { MatchingGenreCard, MatchingGenreSlug } from './types';

export const MATCHING_GENRES: MatchingGenreCard[] = [
  {
    slug: 'action-fighting',
    genreId: 1,
    title: '액션 / 격투',
    subtitle: '빠른 손맛과 정면 승부',
    description:
      '속도감 있는 액션과 강한 타격감을 즐기는 플레이어에게 어울려요.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/1778820/header.jpg',
  },
  {
    slug: 'adventure-platform',
    genreId: 2,
    title: '어드벤처 / 플랫폼',
    subtitle: '탐험과 리듬감 있는 진행',
    description: '가볍게 몰입하면서도 손으로 직접 뛰고 넘는 재미를 느껴보세요.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/1426210/header.jpg',
  },
  {
    slug: 'rpg-story',
    genreId: 3,
    title: 'RPG / 스토리',
    subtitle: '서사와 성장의 몰입감',
    description:
      '캐릭터의 성장과 깊은 이야기를 함께 따라가고 싶은 분께 추천해요.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg',
  },
  {
    slug: 'strategy-simulation',
    genreId: 4,
    title: '전략 / 시뮬',
    subtitle: '판단과 운영의 재미',
    description:
      '장기적인 계획과 운영 감각이 중요한 플레이를 선호할 때 잘 맞아요.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/289070/header.jpg',
  },
  {
    slug: 'sports-racing',
    genreId: 5,
    title: '스포츠 / 레이싱',
    subtitle: '속도감과 경쟁의 짜릿함',
    description:
      '한 판 승부의 긴장감과 시원한 질주 감각을 원하는 플레이어에게 적합해요.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/header.jpg',
  },
  {
    slug: 'brain-strategy',
    genreId: 6,
    title: '두뇌 / 전략',
    subtitle: '생각할수록 즐거운 플레이',
    description:
      '판을 읽고 선택을 쌓아가는 재미를 좋아하는 취향에 어울리는 장르예요.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/2379780/header.jpg',
  },
  {
    slug: 'shooting',
    genreId: 7,
    title: '슈팅',
    subtitle: '반응속도와 타격감',
    description:
      '짧은 순간의 판단과 손맛이 중요한 플레이를 선호한다면 잘 맞습니다.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
  },
  {
    slug: 'rhythm',
    genreId: 8,
    title: '음악 / 리듬',
    subtitle: '비트에 맞춘 템포 플레이',
    description:
      '리듬감과 감각적인 연출을 함께 즐기고 싶은 플레이어를 위한 카테고리예요.',
    thumbnailUrl:
      'https://cdn.cloudflare.steamstatic.com/steam/apps/1817230/header.jpg',
  },
];

const matchingGenreMap = new Map<MatchingGenreSlug, MatchingGenreCard>(
  MATCHING_GENRES.map((genre) => [genre.slug, genre]),
);

export const getMatchingGenreBySlug = (genreSlug?: string) => {
  if (!genreSlug) {
    return undefined;
  }

  return matchingGenreMap.get(genreSlug as MatchingGenreSlug);
};

export const getMatchingGenreById = (genreId?: number) => {
  if (!genreId) {
    return undefined;
  }

  return MATCHING_GENRES.find((genre) => genre.genreId === genreId);
};

export const isMatchingGenreSlug = (
  genreSlug: string,
): genreSlug is MatchingGenreSlug =>
  matchingGenreMap.has(genreSlug as MatchingGenreSlug);
