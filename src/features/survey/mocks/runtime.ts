import { mockTopGames } from '../../games/mockGames';
import type {
  SurveyApiChatRequest,
  SurveyApiResetResponse,
  SurveyApiResultItem,
  SurveyApiResultResponse,
  SurveyApiSessionResponse,
} from '../types/survey';

const MIN_STEPS = 3;
const DEFAULT_STEPS = 4;
const MAX_STEPS = 5;
const DEFAULT_RECOMMENDATION_PAGE_SIZE = 5;

const surveyQuestions = [
  '스토리 중심의 몰입감을 더 중요하게 보시나요, 아니면 손맛과 시스템 완성도를 더 중요하게 보시나요?',
  '혼자 오래 파고드는 플레이와 친구들과 함께 즐기는 플레이 중 어느 쪽에 더 끌리시나요?',
  '그래픽 스타일은 사실적인 쪽과 감성적인 아트 스타일 중 무엇이 더 마음에 드시나요?',
  '보스 공략 같은 강한 도전, 혹은 편하게 수집과 성장에 집중하는 흐름 중 어느 쪽을 더 선호하시나요?',
  '플레이 타임은 짧고 강렬한 편이 좋으신가요, 아니면 오래 파고들며 성장하는 흐름이 좋으신가요?',
] as const;

const SURVEY_RECOMMENDATION_GAME_IDS = [
  1086940, 1245620, 292030, 1091500, 814380, 2050650, 1868140, 367520, 646570,
  1551360, 1364780, 1003590, 412830, 620, 553850,
] as const;

const mockTopGameById = new Map(
  mockTopGames.map((game) => [game.gameId, game]),
);

interface MockSurveySession {
  askedQuestions: number;
  totalQuestions: number;
}

const surveySessions = new Map<string, MockSurveySession>();
let latestCompletedSurveySessionId: string | null = null;

const createSessionId = () => crypto.randomUUID();

const buildProgress = (
  askedQuestions: number,
  totalQuestions: number,
  isCompleted = false,
) => ({
  current_step: askedQuestions,
  total_steps: totalQuestions,
  completion_rate: isCompleted
    ? 1
    : Math.max(0, Math.min((askedQuestions - 1) / totalQuestions, 0.92)),
});

const getQuestionCountFromAnswer = (answer: string) => {
  const normalized = answer.trim();
  const sentenceCount = normalized
    .split(/[.!?\n]/)
    .map((segment) => segment.trim())
    .filter(Boolean).length;
  const keywordMatches = [
    '스토리',
    '전투',
    '그래픽',
    '협동',
    '멀티',
    '싱글',
    '보스',
    '탐험',
    '수집',
    '도전',
    '성장',
    '장르',
    '분위기',
    'RPG',
    'FPS',
  ].filter((keyword) =>
    normalized.toLowerCase().includes(keyword.toLowerCase()),
  ).length;
  const hasVaguePhrase = /(그냥|아무거나|다 좋아|무난|두루뭉실)/.test(
    normalized,
  );

  const detailScore =
    (normalized.length >= 100 ? 2 : normalized.length >= 55 ? 1 : 0) +
    (sentenceCount >= 3 ? 1 : 0) +
    (keywordMatches >= 3 ? 1 : 0) -
    (hasVaguePhrase ? 1 : 0);

  if (detailScore >= 3) {
    return MIN_STEPS;
  }

  if (detailScore <= 0) {
    return MAX_STEPS;
  }

  return DEFAULT_STEPS;
};

const buildSurveyRecommendations = () =>
  SURVEY_RECOMMENDATION_GAME_IDS.map((gameId) => mockTopGameById.get(gameId))
    .filter((game): game is (typeof mockTopGames)[number] => Boolean(game))
    .map<SurveyApiResultItem>((game) => ({
      game_id: game.gameId,
      title: game.name,
      genres: game.genres,
      thumbnail_url: game.thumbnailUrl,
      rating:
        typeof game.rating === 'number' ? Number(game.rating.toFixed(1)) : null,
      is_liked: false,
    }));

export const startMockSurveySession = (): SurveyApiSessionResponse => {
  const sessionId = createSessionId();
  surveySessions.set(sessionId, {
    askedQuestions: 1,
    totalQuestions: MAX_STEPS,
  });

  return {
    session_id: sessionId,
    ai_question: surveyQuestions[0],
    status: 'IN_PROGRESS',
    progress: buildProgress(1, MAX_STEPS),
    recommendation_ready: false,
  };
};

export const continueMockSurveyChat = (
  payload: SurveyApiChatRequest & { session_id: string },
): SurveyApiSessionResponse => {
  const session =
    surveySessions.get(payload.session_id) ??
    ({
      askedQuestions: 1,
      totalQuestions: DEFAULT_STEPS,
    } satisfies MockSurveySession);

  if (session.askedQuestions === 1) {
    session.totalQuestions = getQuestionCountFromAnswer(payload.user_answer);
  }

  if (session.askedQuestions >= session.totalQuestions) {
    surveySessions.set(payload.session_id, session);
    latestCompletedSurveySessionId = payload.session_id;

    return {
      session_id: payload.session_id,
      ai_question: null,
      progress: buildProgress(
        session.totalQuestions,
        session.totalQuestions,
        true,
      ),
      status: 'COMPLETED',
      recommendation_ready: true,
    };
  }

  const nextQuestionIndex = session.askedQuestions;
  session.askedQuestions += 1;
  surveySessions.set(payload.session_id, session);

  return {
    session_id: payload.session_id,
    ai_question: surveyQuestions[nextQuestionIndex] ?? null,
    progress: buildProgress(session.askedQuestions, session.totalQuestions),
    status: 'IN_PROGRESS',
    recommendation_ready: false,
  };
};

export const getMockSurveyResults = ({
  cursor,
  pageSize = DEFAULT_RECOMMENDATION_PAGE_SIZE,
  sessionId,
}: {
  cursor?: string | null;
  pageSize?: number;
  sessionId?: string | null;
}): SurveyApiResultResponse => {
  const recommendations = buildSurveyRecommendations();

  if (!latestCompletedSurveySessionId && !sessionId) {
    return {
      user_id: 1,
      count: 0,
      next: null,
      results: [],
    };
  }

  const startIndex = Number(cursor ?? '0');
  const safeStartIndex = Number.isNaN(startIndex) ? 0 : startIndex;
  const nextIndex = safeStartIndex + pageSize;
  const next = nextIndex < recommendations.length ? String(nextIndex) : null;

  return {
    user_id: 1,
    count: recommendations.length,
    next,
    results: recommendations.slice(safeStartIndex, nextIndex),
  };
};

export const resetMockSurveySession = (
  sessionId: string,
): SurveyApiResetResponse => {
  surveySessions.delete(sessionId);
  if (latestCompletedSurveySessionId === sessionId) {
    latestCompletedSurveySessionId = null;
  }

  const nextSessionId = createSessionId();
  surveySessions.set(nextSessionId, {
    askedQuestions: 1,
    totalQuestions: MAX_STEPS,
  });

  return {
    message: '설문이 초기화되었습니다.',
    session_id: nextSessionId,
    status: 'IN_PROGRESS',
    ai_question: surveyQuestions[0],
    progress: buildProgress(1, MAX_STEPS),
    recommendation_ready: false,
  };
};
