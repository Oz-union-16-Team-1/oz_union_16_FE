import { delay, http, HttpResponse } from 'msw';

import { getMockLikedGameIdsForAuthorization } from '../../auth/mocks/handlers';
import { mockTopGames } from '../../games/mockGames';
import type {
  SurveyApiChatRequest,
  SurveyApiResultItem,
} from '../types/survey';
import {
  DEFAULT_SURVEY_RECOMMENDATION_PAGE_SIZE,
  SURVEY_DEFAULT_STEPS,
  SURVEY_MAX_STEPS,
  SURVEY_MIN_STEPS,
} from './constants';
import { mockErrorResponse } from '../../../mocks/helpers';
import { surveyQuestions, SURVEY_RECOMMENDATION_GAME_IDS } from './data';

const mockTopGameById = new Map(
  mockTopGames.map((game) => [game.gameId, game]),
);

const buildSurveyRecommendations = (authorization: string | null) => {
  const likedGameIds = getMockLikedGameIdsForAuthorization(authorization);

  return SURVEY_RECOMMENDATION_GAME_IDS.map((gameId) =>
    mockTopGameById.get(gameId),
  )
    .filter((game): game is (typeof mockTopGames)[number] => Boolean(game))
    .map<SurveyApiResultItem>((game) => ({
      game_id: game.gameId,
      title: game.name,
      genres: game.genres,
      thumbnail_url: game.thumbnailUrl,
      rating:
        typeof game.rating === 'number' ? Number(game.rating.toFixed(1)) : null,
      is_liked: likedGameIds.has(game.gameId),
    }));
};

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
    return SURVEY_MIN_STEPS;
  }

  if (detailScore <= 0) {
    return SURVEY_MAX_STEPS;
  }

  return SURVEY_DEFAULT_STEPS;
};

export const surveyHandlers = [
  http.post('/api/v1/survey/chatbot/sessions', async () => {
    const sessionId = createSessionId();
    const totalQuestions = SURVEY_MAX_STEPS;

    surveySessions.set(sessionId, {
      askedQuestions: 1,
      totalQuestions,
    });

    await delay(700);

    return HttpResponse.json({
      session_id: sessionId,
      ai_question: surveyQuestions[0],
      status: 'IN_PROGRESS',
      progress: buildProgress(1, totalQuestions),
      recommendation_ready: false,
    });
  }),

  http.post(
    '/api/v1/survey/chatbot/sessions/:sessionId/messages',
    async ({ request, params }) => {
      const body = (await request.json()) as SurveyApiChatRequest;
      const sessionId = String(params.sessionId ?? '');

      if (!sessionId || !body.message?.trim()) {
        return mockErrorResponse(400, '필수 입력 항목입니다.');
      }

      const session =
        surveySessions.get(sessionId) ??
        ({
          askedQuestions: 1,
          totalQuestions: SURVEY_DEFAULT_STEPS,
        } satisfies MockSurveySession);

      if (session.askedQuestions === 1) {
        session.totalQuestions = getQuestionCountFromAnswer(body.message);
      }

      await delay(800);

      if (session.askedQuestions >= session.totalQuestions) {
        surveySessions.set(sessionId, session);
        latestCompletedSurveySessionId = sessionId;

        return HttpResponse.json({
          session_id: sessionId,
          ai_message: null,
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
      surveySessions.set(sessionId, session);

      return HttpResponse.json({
        session_id: sessionId,
        ai_message: surveyQuestions[nextQuestionIndex],
        progress: buildProgress(session.askedQuestions, session.totalQuestions),
        status: 'IN_PROGRESS',
        recommendation_ready: false,
      });
    },
  ),

  http.get(
    '/api/v1/survey/chatbot/sessions/:sessionId/recommendations',
    async ({ request, params }) => {
      const url = new URL(request.url);
      const cursor = Number(url.searchParams.get('cursor') ?? '0');
      const pageSize = Number(
        url.searchParams.get('page_size') ??
          DEFAULT_SURVEY_RECOMMENDATION_PAGE_SIZE,
      );
      const requestedSessionId = String(params.sessionId ?? '');
      const recommendations = buildSurveyRecommendations(
        request.headers.get('authorization'),
      );

      if (
        !latestCompletedSurveySessionId ||
        requestedSessionId !== latestCompletedSurveySessionId
      ) {
        return mockErrorResponse(404, '설문 추천 결과를 찾을 수 없습니다.');
      }

      const startIndex = Number.isNaN(cursor) ? 0 : cursor;
      const nextIndex = startIndex + pageSize;
      const next =
        nextIndex < recommendations.length ? String(nextIndex) : null;

      await delay(500);

      return HttpResponse.json({
        user_id: 1,
        count: recommendations.length,
        next,
        results: recommendations.slice(startIndex, nextIndex),
      });
    },
  ),

  http.post('/api/v1/survey/chatbot/sessions/reset', async () => {
    surveySessions.clear();
    latestCompletedSurveySessionId = null;

    const nextSessionId = createSessionId();
    surveySessions.set(nextSessionId, {
      askedQuestions: 1,
      totalQuestions: SURVEY_MAX_STEPS,
    });

    await delay(350);

    return HttpResponse.json({
      session_id: nextSessionId,
      status: 'IN_PROGRESS',
      ai_question: surveyQuestions[0],
      progress: buildProgress(1, SURVEY_MAX_STEPS),
      recommendation_ready: false,
    });
  }),
];
