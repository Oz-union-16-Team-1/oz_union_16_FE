import { mockTopGames } from './mockGames';
import type { GameDetail } from './types';

const steamCoverUrl = (gameId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${gameId}/library_600x900.jpg`;

const steamStoreUrl = (gameId: number) =>
  `https://store.steampowered.com/app/${gameId}`;

const createMockGameDetail = ({
  gameId,
  title,
  genres,
  releaseDate,
  developer,
  publisher,
  description,
  platforms,
  likeCount,
  isLiked = false,
  officialSite = null,
  epicStore = null,
  promoVideoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${title} 공식 트레일러`,
  )}`,
  promoEmbedUrl = null,
}: {
  gameId: number;
  title: string;
  genres: string[];
  releaseDate: string;
  developer: string;
  publisher: string;
  description: string;
  platforms: string[];
  likeCount: number;
  isLiked?: boolean;
  officialSite?: string | null;
  epicStore?: string | null;
  promoVideoUrl?: string | null;
  promoEmbedUrl?: string | null;
}): GameDetail => ({
  gameId,
  title,
  genres,
  releaseDate,
  developer,
  publisher,
  promoVideoUrl,
  promoEmbedUrl,
  coverImageUrl: steamCoverUrl(gameId),
  description,
  platforms: platforms.map((name) => ({ name })),
  externalLinks: {
    officialSite,
    steam: steamStoreUrl(gameId),
    epicStore,
  },
  likeCount,
  isLiked,
});

export const mockGameDetails: Record<number, GameDetail> = {
  1245620: createMockGameDetail({
    gameId: 1245620,
    title: '엘든 링',
    genres: ['액션', 'RPG'],
    releaseDate: '2022-02-25',
    developer: 'FromSoftware',
    publisher: 'Bandai Namco Entertainment',
    description:
      '황금률이 무너진 틈새의 땅을 배경으로, 플레이어는 빛바랜 자가 되어 엘든 링의 힘을 되찾기 위한 여정을 떠납니다. 방대한 오픈 월드와 던전, 강력한 보스전, 자유도 높은 빌드 구성이 핵심입니다.',
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S'],
    likeCount: 1250,
    officialSite: 'https://www.eldenring.com/',
  }),
  2358720: createMockGameDetail({
    gameId: 2358720,
    title: '검은 신화: 오공',
    genres: ['RPG'],
    releaseDate: '2024-08-20',
    developer: 'Game Science',
    publisher: 'Game Science',
    description:
      '서유기에서 영감을 받은 액션 RPG입니다. 천명자는 신화 속 존재와 맞서며 잊힌 진실을 좇고, 빠른 전투와 변신 능력, 보스 공략을 중심으로 모험을 진행합니다.',
    platforms: ['PC', 'PS5', 'Xbox Series X|S'],
    likeCount: 980,
    officialSite: 'https://www.heishenhua.com/',
  }),
  2679460: createMockGameDetail({
    gameId: 2679460,
    title: '메타포: 리판타지오',
    genres: ['RPG', '전략'],
    releaseDate: '2024-10-11',
    developer: 'Studio Zero',
    publisher: 'Atlus',
    description:
      '왕의 죽음 이후 혼란에 빠진 판타지 세계에서 주인공 일행이 새로운 왕을 정하는 선거에 뛰어듭니다. 턴제 전투, 아키타입 성장, 동료와의 유대가 결합된 RPG입니다.',
    platforms: ['PC', 'PS4', 'PS5', 'Xbox Series X|S'],
    likeCount: 740,
    officialSite: 'https://metaphor.atlus.com/',
  }),
  1845910: createMockGameDetail({
    gameId: 1845910,
    title: '드래곤 에이지: 베일가드',
    genres: ['RPG', '어드벤처'],
    releaseDate: '2024-10-31',
    developer: 'BioWare',
    publisher: 'Electronic Arts',
    description:
      '테다스 세계를 위협하는 고대의 신들에 맞서 동료를 모으고 베일가드를 이끄는 판타지 RPG입니다. 선택과 관계, 파티 기반 전투가 이야기의 중심을 이룹니다.',
    platforms: ['PC', 'PS5', 'Xbox Series X|S'],
    likeCount: 510,
    officialSite:
      'https://www.ea.com/games/dragon-age/dragon-age-the-veilguard',
  }),
  1086940: createMockGameDetail({
    gameId: 1086940,
    title: '발더스 게이트 3',
    genres: ['RPG'],
    releaseDate: '2023-08-03',
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    description:
      '던전 앤 드래곤 5판 규칙을 기반으로 한 파티 RPG입니다. 플레이어의 선택과 주사위 판정이 전투, 대화, 탐험 결과를 크게 바꾸며 다양한 방식으로 이야기를 풀어갈 수 있습니다.',
    platforms: ['PC', 'macOS', 'PS5', 'Xbox Series X|S'],
    likeCount: 1430,
    officialSite: 'https://baldursgate3.game/',
  }),
  292030: createMockGameDetail({
    gameId: 292030,
    title: '더 위쳐 3: 와일드 헌트',
    genres: ['어드벤처', 'RPG'],
    releaseDate: '2015-05-18',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    description:
      '괴물 사냥꾼 게롤트가 시리를 찾아 전쟁과 음모가 뒤섞인 대륙을 누비는 오픈 월드 RPG입니다. 선택에 따라 달라지는 퀘스트와 풍부한 서사가 강점입니다.',
    platforms: [
      'PC',
      'PS4',
      'PS5',
      'Xbox One',
      'Xbox Series X|S',
      'Nintendo Switch',
    ],
    likeCount: 1320,
    officialSite: 'https://www.thewitcher.com/witcher3',
  }),
  1091500: createMockGameDetail({
    gameId: 1091500,
    title: '사이버펑크 2077',
    genres: ['RPG', '액션'],
    releaseDate: '2020-12-10',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    description:
      '거대 기업과 갱단이 지배하는 나이트 시티에서 용병 V가 생존과 자유를 위해 싸우는 오픈 월드 RPG입니다. 사이버웨어, 총격전, 해킹, 선택형 서사가 결합되어 있습니다.',
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S'],
    likeCount: 1180,
    officialSite: 'https://www.cyberpunk.net/',
  }),
  582010: createMockGameDetail({
    gameId: 582010,
    title: '몬스터 헌터: 월드',
    genres: ['액션', '어드벤처'],
    releaseDate: '2018-08-09',
    developer: 'Capcom',
    publisher: 'Capcom',
    description:
      '신대륙을 조사하는 헌터가 거대한 몬스터를 추적하고 사냥하는 액션 게임입니다. 장비 제작, 협동 플레이, 몬스터별 패턴 공략이 핵심 재미입니다.',
    platforms: ['PC', 'PS4', 'Xbox One'],
    likeCount: 920,
    officialSite: 'https://www.monsterhunter.com/world/',
  }),
  814380: createMockGameDetail({
    gameId: 814380,
    title: '세키로: 섀도우 다이 트와이스',
    genres: ['액션', '어드벤처'],
    releaseDate: '2019-03-22',
    developer: 'FromSoftware',
    publisher: 'Activision',
    description:
      '전국 시대풍 세계에서 외팔이 늑대가 주군을 구하기 위해 싸우는 액션 어드벤처입니다. 자세를 무너뜨리는 검극, 잠입, 의수 도구 활용이 전투의 중심입니다.',
    platforms: ['PC', 'PS4', 'Xbox One'],
    likeCount: 870,
    officialSite: 'https://www.sekirothegame.com/',
  }),
  2050650: createMockGameDetail({
    gameId: 2050650,
    title: '바이오하자드 RE:4',
    genres: ['액션', '슈팅'],
    releaseDate: '2023-03-24',
    developer: 'Capcom',
    publisher: 'Capcom',
    description:
      '요원 레온 S. 케네디가 납치된 대통령의 딸을 구하기 위해 폐쇄적인 마을로 향하는 서바이벌 호러 액션입니다. 원작의 긴장감을 현대적인 조작과 연출로 재구성했습니다.',
    platforms: ['PC', 'PS4', 'PS5', 'Xbox Series X|S'],
    likeCount: 690,
    officialSite: 'https://www.residentevil.com/re4/',
  }),
  553850: createMockGameDetail({
    gameId: 553850,
    title: '헬다이버즈 2',
    genres: ['슈팅', '액션'],
    releaseDate: '2024-02-08',
    developer: 'Arrowhead Game Studios',
    publisher: 'PlayStation Publishing',
    description:
      '슈퍼 지구를 위해 외계 세력과 싸우는 협동 슈팅 게임입니다. 분대 전술, 스트라타젬 호출, 아군 오사까지 포함한 혼란스러운 전장이 특징입니다.',
    platforms: ['PC', 'PS5'],
    likeCount: 830,
    officialSite: 'https://www.playstation.com/games/helldivers-2/',
  }),
  1623730: createMockGameDetail({
    gameId: 1623730,
    title: '팰월드',
    genres: ['어드벤처', '시뮬레이션'],
    releaseDate: '2024-01-19',
    developer: 'Pocketpair',
    publisher: 'Pocketpair',
    description:
      '팰을 수집하고 함께 전투, 건축, 생산을 이어가는 오픈 월드 생존 게임입니다. 기지 운영과 탐험, 협동 플레이가 결합되어 있습니다.',
    platforms: ['PC', 'Xbox One', 'Xbox Series X|S'],
    likeCount: 760,
    officialSite: 'https://www.pocketpair.jp/palworld',
  }),
  1145350: createMockGameDetail({
    gameId: 1145350,
    title: '하데스 2',
    genres: ['액션', '어드벤처'],
    releaseDate: '2024-05-06',
    developer: 'Supergiant Games',
    publisher: 'Supergiant Games',
    description:
      '저승의 공주 멜리노에가 시간의 티탄 크로노스에 맞서는 로그라이크 액션 게임입니다. 반복 도전 속에서 무기, 은혜, 주문을 조합해 새로운 빌드를 완성합니다.',
    platforms: ['PC'],
    likeCount: 650,
    officialSite: 'https://www.supergiantgames.com/games/hades-ii/',
  }),
  367520: createMockGameDetail({
    gameId: 367520,
    title: '할로우 나이트',
    genres: ['어드벤처', '플랫폼'],
    releaseDate: '2017-02-24',
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
    description:
      '몰락한 왕국 할로우네스트를 탐험하는 메트로배니아 액션 게임입니다. 정교한 플랫폼, 보스전, 탐험을 통해 세계의 비밀을 천천히 밝혀갑니다.',
    platforms: ['PC', 'macOS', 'Linux', 'PS4', 'Xbox One', 'Nintendo Switch'],
    likeCount: 1040,
    officialSite: 'https://www.hollowknight.com/',
  }),
  1627720: createMockGameDetail({
    gameId: 1627720,
    title: 'P의 거짓',
    genres: ['액션', 'RPG'],
    releaseDate: '2023-09-19',
    developer: 'Neowiz Games, Round8 Studio',
    publisher: 'Neowiz Games',
    description:
      '피노키오를 어둡게 재해석한 소울라이크 액션 RPG입니다. 기계 인형이 폭주한 크라트에서 진실과 거짓을 오가며 전투와 선택을 이어갑니다.',
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S'],
    likeCount: 590,
    officialSite: 'https://www.liesofp.com/',
  }),
  1868140: createMockGameDetail({
    gameId: 1868140,
    title: '데이브 더 다이버',
    genres: ['어드벤처', '시뮬레이션'],
    releaseDate: '2023-06-28',
    developer: 'MINTROCKET',
    publisher: 'MINTROCKET',
    description:
      '낮에는 블루홀을 탐험해 해산물을 잡고, 밤에는 초밥집을 운영하는 어드벤처 경영 게임입니다. 탐험, 채집, 매장 운영이 가볍고 유쾌하게 이어집니다.',
    platforms: ['PC', 'macOS', 'PS4', 'PS5', 'Nintendo Switch'],
    likeCount: 710,
    officialSite: 'https://mintrocketgames.com/en/DaveTheDiver',
  }),
  646570: createMockGameDetail({
    gameId: 646570,
    title: '슬레이 더 스파이어',
    genres: ['전략', '카드 / 보드'],
    releaseDate: '2019-01-23',
    developer: 'Mega Crit',
    publisher: 'Mega Crit',
    description:
      '카드 덱을 구성하며 첨탑을 오르는 로그라이크 덱빌딩 게임입니다. 매 전투와 이벤트에서 얻는 카드, 유물, 선택이 새로운 전략을 만듭니다.',
    platforms: [
      'PC',
      'macOS',
      'Linux',
      'PS4',
      'Xbox One',
      'Nintendo Switch',
      'iOS',
      'Android',
    ],
    likeCount: 860,
    officialSite: 'https://www.megacrit.com/',
  }),
  2379780: createMockGameDetail({
    gameId: 2379780,
    title: '발라트로',
    genres: ['카드 / 보드', '전략'],
    releaseDate: '2024-02-20',
    developer: 'LocalThunk',
    publisher: 'Playstack',
    description:
      '포커 족보를 기반으로 점수를 폭발적으로 키우는 로그라이크 덱빌딩 게임입니다. 조커와 카드 강화 조합을 통해 매 판 다른 점수 엔진을 완성합니다.',
    platforms: [
      'PC',
      'macOS',
      'PS4',
      'PS5',
      'Xbox One',
      'Xbox Series X|S',
      'Nintendo Switch',
      'iOS',
      'Android',
    ],
    likeCount: 790,
    officialSite: 'https://www.playbalatro.com/',
  }),
  548430: createMockGameDetail({
    gameId: 548430,
    title: '딥 락 갤럭틱',
    genres: ['슈팅', '액션'],
    releaseDate: '2020-05-13',
    developer: 'Ghost Ship Games',
    publisher: 'Coffee Stain Publishing',
    description:
      '우주 드워프 광부들이 절차적으로 생성되는 동굴에서 자원을 채굴하고 외계 생물과 싸우는 협동 FPS입니다. 직업별 장비와 팀워크가 중요합니다.',
    platforms: ['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X|S'],
    likeCount: 680,
    officialSite: 'https://www.deeprockgalactic.com/',
  }),
  105600: createMockGameDetail({
    gameId: 105600,
    title: '테라리아',
    genres: ['어드벤처', '플랫폼'],
    releaseDate: '2011-05-16',
    developer: 'Re-Logic',
    publisher: 'Re-Logic',
    description:
      '2D 샌드박스 세계에서 채집, 건축, 탐험, 보스전을 자유롭게 즐기는 어드벤처 게임입니다. 장비 성장과 월드 변화가 긴 플레이 흐름을 만듭니다.',
    platforms: [
      'PC',
      'macOS',
      'Linux',
      'PS4',
      'Xbox One',
      'Nintendo Switch',
      'iOS',
      'Android',
    ],
    likeCount: 1120,
    officialSite: 'https://terraria.org/',
  }),
};

export const getMockGameDetail = (gameId: number): GameDetail => {
  const detail = mockGameDetails[gameId];

  if (detail) {
    return detail;
  }

  const game = mockTopGames.find((item) => item.gameId === gameId);

  return {
    gameId,
    title: game?.name ?? 'N/A',
    genres: game?.genres.length ? game.genres : ['N/A'],
    releaseDate: null,
    developer: null,
    publisher: null,
    promoVideoUrl: null,
    promoEmbedUrl: null,
    coverImageUrl: game?.thumbnailUrl ?? null,
    description: null,
    platforms: [],
    externalLinks: {
      officialSite: null,
      steam: game ? steamStoreUrl(game.gameId) : null,
      epicStore: null,
    },
    likeCount: 0,
    isLiked: game?.isLiked ?? null,
  };
};

export const updateMockGameLikeStatus = (gameId: number, isLiked: boolean) => {
  const detail = mockGameDetails[gameId] ?? getMockGameDetail(gameId);
  const currentLiked = detail.isLiked === true;
  const likeCountAdjustment = currentLiked === isLiked ? 0 : isLiked ? 1 : -1;
  const likeCount = Math.max(0, detail.likeCount + likeCountAdjustment);

  detail.isLiked = isLiked;
  detail.likeCount = likeCount;
  mockGameDetails[gameId] = detail;

  return {
    gameId,
    isLiked,
    likeCount,
  };
};
