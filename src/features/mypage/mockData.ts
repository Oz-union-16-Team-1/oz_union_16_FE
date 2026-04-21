import type { FavoriteGamePreview, MyPageProfile } from './types';

export const mockMyPageProfile: MyPageProfile = {
  nickname: '데모유저',
};

export const mockFavoriteGames: FavoriteGamePreview[] = [
  {
    gameId: 901,
    title: 'Eclipse Gate',
    summary: '차원의 문 너머에서 펼쳐지는 탐험과 전투를 다시 즐겨보세요.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    genres: ['Action', 'RPG'],
  },
  {
    gameId: 902,
    title: 'Frozen Crown',
    summary: '서늘한 설원과 거대한 성채가 인상적인 액션 어드벤처입니다.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    genres: ['Adventure', 'Action'],
  },
  {
    gameId: 903,
    title: 'Crimson Trail',
    summary: '붉게 물든 협곡을 따라 몰입감 있는 전투와 성장 루프를 경험하세요.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1200&q=80',
    genres: ['Action', 'Shooter'],
  },
  {
    gameId: 904,
    title: 'Astral Keep',
    summary: '별빛 아래 펼쳐지는 성채 수비전과 전략적인 플레이가 특징입니다.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1200&q=80',
    genres: ['Strategy', 'Simulation'],
  },
  {
    gameId: 905,
    title: 'Moonlit Archive',
    summary: '고요한 도서관 속 숨겨진 퍼즐과 서사를 차근차근 풀어보세요.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80',
    genres: ['Puzzle', 'Adventure'],
  },
  {
    gameId: 906,
    title: 'Neon Drift',
    summary: '강렬한 분위기의 레이싱과 속도감을 원하는 날에 딱 어울립니다.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1200&q=80',
    genres: ['Racing', 'Arcade'],
  },
];
