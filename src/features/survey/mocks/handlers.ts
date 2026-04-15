import { delay, http, HttpResponse } from 'msw';

import type {
  SurveyChatRequest,
  SurveyResetRequest,
  SurveyResultItem,
} from '../types/survey';

const MIN_STEPS = 3;
const DEFAULT_STEPS = 4;
const MAX_STEPS = 5;

const surveyQuestions = [
  '스토리 중심의 몰입감을 더 중요하게 보시나요, 아니면 손맛과 시스템 완성도를 더 중요하게 보시나요?',
  '혼자 오래 파고드는 플레이와 친구들과 함께 즐기는 플레이 중 어느 쪽에 더 끌리시나요?',
  '그래픽 스타일은 사실적인 쪽과 감성적인 아트 스타일 중 무엇이 더 마음에 드시나요?',
  '보스 공략 같은 강한 도전, 혹은 편하게 수집과 성장에 집중하는 흐름 중 어느 쪽을 더 선호하시나요?',
  '플레이 타임은 짧고 강렬한 편이 좋으신가요, 아니면 오래 파고들며 성장하는 흐름이 좋으신가요?',
];

const recommendations: SurveyResultItem[] = [
  {
    game_id: 501,
    name: '호랑나비 어드벤처',
    genres: ['RPG', '어드벤처'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    is_liked: false,
  },
  {
    game_id: 502,
    name: '이터널 오딧세이',
    genres: ['액션', 'RPG'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    is_liked: true,
  },
  {
    game_id: 503,
    name: '스타폴 택틱스',
    genres: ['전략', '시뮬레이션'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=800&q=80',
    rating: 4.4,
    is_liked: false,
  },
  {
    game_id: 504,
    name: '크림슨 서킷',
    genres: ['슈팅', '로그라이트'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=800&q=80',
    rating: 4.3,
    is_liked: false,
  },
  {
    game_id: 505,
    name: '문라이트 캔버스',
    genres: ['비주얼 노벨', '퍼즐'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    is_liked: true,
  },
  {
    game_id: 506,
    name: '드리프트 네온',
    genres: ['레이싱', '스포츠'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=800&q=80',
    rating: 4.1,
    is_liked: false,
  },
  {
    game_id: 507,
    name: '노던 랩소디',
    genres: ['어드벤처', '스토리'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    is_liked: false,
  },
  {
    game_id: 508,
    name: '제로아워 레이드',
    genres: ['FPS', '협동'],
    thumbnail_url:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    rating: 4.2,
    is_liked: true,
  },
];

interface MockSurveySession {
  askedQuestions: number;
  totalQuestions: number;
}

const surveySessions = new Map<string, MockSurveySession>();

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

const getErrorResponse = (status: number, message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status },
  );

export const surveyHandlers = [
  http.post('/api/v1/survey/chat/sessions', async () => {
    const sessionId = createSessionId();
    surveySessions.set(sessionId, {
      askedQuestions: 1,
      totalQuestions: DEFAULT_STEPS,
    });

    await delay(700);

    return HttpResponse.json({
      session_id: sessionId,
      ai_question: surveyQuestions[0],
      status: 'IN_PROGRESS',
      progress: buildProgress(1, DEFAULT_STEPS),
    });
  }),

  http.post('/api/v1/survey/chat', async ({ request }) => {
    const body = (await request.json()) as SurveyChatRequest;

    if (!body.session_id || !body.user_answer?.trim()) {
      return getErrorResponse(400, '필수 입력 항목입니다.');
    }

    const session =
      surveySessions.get(body.session_id) ??
      ({
        askedQuestions: 1,
        totalQuestions: DEFAULT_STEPS,
      } satisfies MockSurveySession);

    if (session.askedQuestions === 1) {
      session.totalQuestions = getQuestionCountFromAnswer(body.user_answer);
    }

    await delay(800);

    if (session.askedQuestions >= session.totalQuestions) {
      surveySessions.set(body.session_id, session);

      return HttpResponse.json({
        session_id: body.session_id,
        ai_question: null,
        progress: buildProgress(
          session.totalQuestions,
          session.totalQuestions,
          true,
        ),
        status: 'COMPLETED',
        recommendation_ready: true,
      });
    }

    const nextQuestionIndex = session.askedQuestions;
    session.askedQuestions += 1;
    surveySessions.set(body.session_id, session);

    return HttpResponse.json({
      session_id: body.session_id,
      ai_question: surveyQuestions[nextQuestionIndex],
      progress: buildProgress(session.askedQuestions, session.totalQuestions),
      status: 'IN_PROGRESS',
      recommendation_ready: false,
    });
  }),

  http.get('/api/v1/survey/result', async ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    const cursor = Number(url.searchParams.get('cursor') ?? '0');
    const pageSize = Number(url.searchParams.get('page_size') ?? '4');

    if (!sessionId) {
      return getErrorResponse(400, 'session_id는 필수입니다.');
    }

    if (!surveySessions.has(sessionId)) {
      return getErrorResponse(404, '설문 추천 결과를 찾을 수 없습니다.');
    }

    const startIndex = Number.isNaN(cursor) ? 0 : cursor;
    const nextIndex = startIndex + pageSize;
    const next = nextIndex < recommendations.length ? String(nextIndex) : null;

    await delay(500);

    return HttpResponse.json({
      session_id: sessionId,
      user_id: 1,
      count: recommendations.length,
      next,
      results: recommendations.slice(startIndex, nextIndex),
    });
  }),

  http.post('/api/v1/survey/sessions/reset', async ({ request }) => {
    const body = (await request.json()) as SurveyResetRequest;

    if (!body.session_id) {
      return getErrorResponse(400, 'session_id는 필수입니다.');
    }

    surveySessions.delete(body.session_id);

    await delay(350);

    return HttpResponse.json({
      message: '설문이 초기화되었습니다.',
      reset: true,
    });
  }),
];
