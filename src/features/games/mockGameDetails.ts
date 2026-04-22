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
    likeCount: 0,
    officialSite: 'https://www.eldenring.com/',
    promoEmbedUrl: 'https://www.youtube.com/embed/qqiC88f9ogU',
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
    likeCount: 0,
    officialSite: 'https://www.heishenhua.com/',
    promoEmbedUrl: 'https://www.youtube.com/embed/0Zw-mo0EFt0',
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
    likeCount: 0,
    officialSite: 'https://metaphor.atlus.com/',
    promoEmbedUrl: 'https://www.youtube.com/embed/yQPk4cVrU_w',
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
    likeCount: 0,
    officialSite:
      'https://www.ea.com/games/dragon-age/dragon-age-the-veilguard',
    promoEmbedUrl: 'https://www.youtube.com/embed/NdtmtuzICOI',
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
    likeCount: 0,
    officialSite: 'https://baldursgate3.game/',
    promoEmbedUrl: 'https://www.youtube.com/embed/1T22wNvoNiU',
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
    likeCount: 0,
    officialSite: 'https://www.thewitcher.com/witcher3',
    promoEmbedUrl: 'https://www.youtube.com/embed/XHrskkHf958',
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
    likeCount: 0,
    officialSite: 'https://www.cyberpunk.net/',
    promoEmbedUrl: 'https://www.youtube.com/embed/UnA7tepsc7s',
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
    likeCount: 0,
    officialSite: 'https://www.monsterhunter.com/world/',
    promoEmbedUrl: 'https://www.youtube.com/embed/KsmAreIFel0',
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
    likeCount: 0,
    officialSite: 'https://www.sekirothegame.com/',
    promoEmbedUrl: 'https://www.youtube.com/embed/aUnEezrBFoA',
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
    likeCount: 0,
    officialSite: 'https://www.residentevil.com/re4/',
    promoEmbedUrl: 'https://www.youtube.com/embed/isN_Y9ULtXY',
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
    likeCount: 0,
    officialSite: 'https://www.playstation.com/games/helldivers-2/',
    promoEmbedUrl: 'https://www.youtube.com/embed/Ahx35iVJn10',
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
    likeCount: 0,
    officialSite: 'https://www.pocketpair.jp/palworld',
    promoEmbedUrl: 'https://www.youtube.com/embed/ZPu9yAOEYkQ',
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
    likeCount: 0,
    officialSite: 'https://www.supergiantgames.com/games/hades-ii/',
    promoEmbedUrl: 'https://www.youtube.com/embed/txQKYcbIAHU',
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
    likeCount: 0,
    officialSite: 'https://www.hollowknight.com/',
    promoEmbedUrl: 'https://www.youtube.com/embed/UAO2urG23S4',
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
    likeCount: 0,
    officialSite: 'https://www.liesofp.com/',
    promoEmbedUrl: 'https://www.youtube.com/embed/kXZoKdr-xeo',
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
    likeCount: 0,
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
    likeCount: 0,
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
    likeCount: 0,
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
    likeCount: 0,
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
    likeCount: 0,
    officialSite: 'https://terraria.org/',
  }),
  2669320: createMockGameDetail({
    gameId: 2669320,
    title: 'EA SPORTS FC 25',
    genres: ['스포츠'],
    releaseDate: '2024-09-27',
    developer: 'EA Vancouver, EA Romania',
    publisher: 'Electronic Arts',
    description:
      '실제 리그와 클럽을 기반으로 한 축구 게임입니다. 빠른 한 경기 플레이부터 시즌 운영, 온라인 경쟁전까지 폭넓은 스포츠 경험을 제공합니다.',
    likeCount: 0,
    officialSite: 'https://www.ea.com/games/ea-sports-fc/fc-25',
  }),
  2252570: createMockGameDetail({
    gameId: 2252570,
    title: '풋볼 매니저 2024',
    genres: ['스포츠', '시뮬레이션'],
    releaseDate: '2023-11-06',
    developer: 'Sports Interactive',
    publisher: 'SEGA',
    description:
      '감독이 되어 스카우팅, 전술, 라인업, 재정까지 직접 운영하는 축구 시뮬레이션입니다. 경기장 밖 의사결정의 비중이 큰 장르를 좋아하는 유저에게 잘 맞습니다.',
    likeCount: 0,
    officialSite: 'https://www.footballmanager.com/',
  }),
  1551360: createMockGameDetail({
    gameId: 1551360,
    title: '포르자 호라이즌 5',
    genres: ['레이싱', '스포츠'],
    releaseDate: '2021-11-09',
    developer: 'Playground Games',
    publisher: 'Xbox Game Studios',
    description:
      '멕시코를 배경으로 한 오픈 월드 레이싱 게임입니다. 실차 수집, 드라이빙 감각, 자유로운 탐험이 자연스럽게 이어지는 것이 강점입니다.',
    likeCount: 0,
    officialSite: 'https://forza.net/horizon',
  }),
  1846380: createMockGameDetail({
    gameId: 1846380,
    title: '니드 포 스피드 언바운드',
    genres: ['레이싱', '액션'],
    releaseDate: '2022-12-02',
    developer: 'Criterion Games',
    publisher: 'Electronic Arts',
    description:
      '거리 레이싱과 경찰 추격전, 화려한 연출이 결합된 아케이드 레이싱 게임입니다. 속도감과 스타일을 함께 중시하는 플레이어에게 어울립니다.',
    likeCount: 0,
    officialSite:
      'https://www.ea.com/games/need-for-speed/need-for-speed-unbound',
  }),
  1364780: createMockGameDetail({
    gameId: 1364780,
    title: '스트리트 파이터 6',
    genres: ['대전 / 격투', '액션'],
    releaseDate: '2023-06-02',
    developer: 'Capcom',
    publisher: 'Capcom',
    description:
      '정교한 프레임 싸움과 읽기 싸움이 핵심인 대전 격투 게임입니다. 현대적인 조작 옵션과 풍부한 싱글 콘텐츠로 입문자와 숙련자 모두를 겨냥합니다.',
    likeCount: 0,
    officialSite: 'https://www.streetfighter.com/6/',
  }),
  1778820: createMockGameDetail({
    gameId: 1778820,
    title: '철권 8',
    genres: ['대전 / 격투'],
    releaseDate: '2024-01-26',
    developer: 'Bandai Namco Studios',
    publisher: 'Bandai Namco Entertainment',
    description:
      '공격적인 공방 설계를 강조한 3D 격투 게임입니다. 캐릭터별 손맛과 콤보 감각이 뚜렷해서 대전 / 격투 장르 필터 검증에도 잘 맞는 타이틀입니다.',
    likeCount: 0,
    officialSite: 'https://tekken.com/',
  }),
  1003590: createMockGameDetail({
    gameId: 1003590,
    title: '테트리스 이펙트: 커넥티드',
    genres: ['퍼즐', '음악 / 리듬'],
    releaseDate: '2021-08-18',
    developer: 'Monstars Inc., Resonair, Stage Games',
    publisher: 'Enhance',
    description:
      '테트리스 플레이에 음악과 시각 연출이 밀착된 퍼즐 게임입니다. 리듬감 있는 몰입과 짧은 세션 플레이를 좋아하는 유저에게 적합합니다.',
    likeCount: 0,
    officialSite: 'https://www.tetriseffect.game/',
  }),
  620: createMockGameDetail({
    gameId: 620,
    title: '포탈 2',
    genres: ['퍼즐', '어드벤처'],
    releaseDate: '2011-04-19',
    developer: 'Valve',
    publisher: 'Valve',
    description:
      '포털 건을 활용해 공간 퍼즐을 푸는 1인칭 퍼즐 어드벤처입니다. 기발한 퍼즐 구조와 코믹한 서사 덕분에 여전히 장르 대표작으로 평가받습니다.',
    likeCount: 0,
    officialSite: 'https://www.thinkwithportals.com/',
  }),
  1761390: createMockGameDetail({
    gameId: 1761390,
    title: '하츠네 미쿠 Project DIVA Mega Mix+',
    genres: ['음악 / 리듬'],
    releaseDate: '2022-05-27',
    developer: 'SEGA',
    publisher: 'SEGA',
    description:
      '보컬로이드 곡에 맞춰 노트를 처리하는 리듬 게임입니다. 수록곡이 많고, 난이도 폭도 넓어서 음악 / 리듬 장르 검증에 적합합니다.',
    likeCount: 0,
    officialSite: 'https://asia.sega.com/megamixplus/',
  }),
  960170: createMockGameDetail({
    gameId: 960170,
    title: 'DJMAX RESPECT V',
    genres: ['음악 / 리듬'],
    releaseDate: '2020-03-12',
    developer: 'NEOWIZ',
    publisher: 'NEOWIZ',
    description:
      '키음을 중심으로 한 하드코어 리듬 게임입니다. 고난도 패턴과 손맛을 선호하는 유저에게 특히 인기가 높습니다.',
    likeCount: 0,
    officialSite: 'https://store.steampowered.com/app/960170/DJMAX_RESPECT_V/',
  }),
  412830: createMockGameDetail({
    gameId: 412830,
    title: 'STEINS;GATE',
    genres: ['비주얼 노벨'],
    releaseDate: '2016-09-09',
    developer: 'MAGES., Nitroplus',
    publisher: 'Spike Chunsoft',
    description:
      '문자 메시지 하나가 세계선을 바꾸는 SF 비주얼 노벨입니다. 텍스트 서사 중심 장르를 확인하기에 좋은 대표작입니다.',
    likeCount: 0,
    officialSite: 'https://www.kirikiribasara.com/steinsgate/',
  }),
  1388880: createMockGameDetail({
    gameId: 1388880,
    title: '도키도키 문예부 플러스!',
    genres: ['비주얼 노벨', '어드벤처'],
    releaseDate: '2021-06-30',
    developer: 'Team Salvato',
    publisher: 'Serenity Forge',
    description:
      '겉보기와 다른 전개로 강한 인상을 남기는 심리 호러 비주얼 노벨입니다. 텍스트 중심 게임과 어드벤처 감각이 함께 섞인 사례로 활용할 수 있습니다.',
    likeCount: 0,
    officialSite: 'https://ddlc.plus/',
  }),
  504230: createMockGameDetail({
    gameId: 504230,
    title: 'Celeste',
    genres: ['플랫폼', '어드벤처'],
    releaseDate: '2018-01-25',
    developer: 'Extremely OK Games',
    publisher: 'Matt Makes Games Inc.',
    description:
      '짧고 정교한 조작으로 산을 오르는 고난도 플랫폼 게임입니다. 반복 도전과 서정적인 이야기의 조합이 강점입니다.',
    likeCount: 0,
    officialSite: 'https://www.celestegame.com/',
  }),
  289070: createMockGameDetail({
    gameId: 289070,
    title: '문명 VI',
    genres: ['전략', '시뮬레이션'],
    releaseDate: '2016-10-21',
    developer: 'Firaxis Games',
    publisher: '2K',
    description:
      '문명을 성장시키고 외교, 과학, 전쟁, 문화 승리를 노리는 턴제 전략 게임입니다. 전략과 시뮬레이션 경계를 함께 확인하기 좋은 대표 타이틀입니다.',
    likeCount: 0,
    officialSite: 'https://civilization.2k.com/civ-vi/',
  }),
};
