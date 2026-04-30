import { delay, http, HttpResponse } from 'msw';

import {
  buildSupportChatFallbackMessage,
  createDefaultRouteContext,
  findSupportFaqEntry,
} from '../data/faqs';
import type {
  ChatbotMessageRequest,
  ChatbotMessageResponse,
} from '../types/supportChat';
import { mockErrorResponse } from '../../../mocks/helpers';

// 고객센터 챗봇 mock 전용 엔드포인트.
// 설문 챗봇(`/api/v1/survey/chatbot/*`) mock과 경계를 분리한다.
const CHATBOT_BASE_PATH = '/api/v1/chatbot';

type MockChatSession = {
  id: string;
  lastReply: string;
  expiresAt: string;
  expiresInSeconds: number;
  sessionTtlSeconds: number;
};

const chatSessions = new Map<string, MockChatSession>();
const CHAT_SESSION_TTL_SECONDS = 1800;

const isExpiredSession = (session: MockChatSession) =>
  Number.isFinite(Date.parse(session.expiresAt)) &&
  Date.parse(session.expiresAt) <= Date.now();

const splitMessageIntoChunks = (message: string) => {
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < message.length) {
    const size = Math.min(message.length - cursor, cursor % 3 === 0 ? 10 : 14);
    chunks.push(message.slice(cursor, cursor + size));
    cursor += size;
  }

  return chunks;
};

const createStreamResponse = (session: MockChatSession) => {
  const encoder = new TextEncoder();
  const chunks = splitMessageIntoChunks(session.lastReply);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const pushEvent = async (eventName: string, data: object) => {
        controller.enqueue(
          encoder.encode(
            `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      void (async () => {
        await pushEvent('start', {
          session_id: session.id,
          expires_at: session.expiresAt,
          expires_in_seconds: session.expiresInSeconds,
          session_ttl_seconds: session.sessionTtlSeconds,
        });

        for (const chunk of chunks) {
          await delay(140);
          await pushEvent('chunk', { content: chunk });
        }

        await delay(100);
        await pushEvent('complete', { session_id: session.id });
        controller.close();
      })().catch((error) => {
        controller.error(error);
      });
    },
  });

  return new HttpResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};

export const supportChatHandlers = [
  http.post(`${CHATBOT_BASE_PATH}/messages`, async ({ request }) => {
    const body = (await request.json()) as ChatbotMessageRequest;
    const message = body.message.trim();

    if (message.length < 2) {
      return mockErrorResponse(
        400,
        '메시지는 공백일 수 없고 2자 이상이어야 합니다.',
      );
    }

    const sessionId = crypto.randomUUID();

    const matchedEntry = findSupportFaqEntry(message);
    const reply =
      matchedEntry?.answer ??
      buildSupportChatFallbackMessage(createDefaultRouteContext());
    const expiresAt = new Date(
      Date.now() + CHAT_SESSION_TTL_SECONDS * 1000,
    ).toISOString();

    chatSessions.set(sessionId, {
      id: sessionId,
      lastReply: reply,
      expiresAt,
      expiresInSeconds: CHAT_SESSION_TTL_SECONDS,
      sessionTtlSeconds: CHAT_SESSION_TTL_SECONDS,
    });

    await delay(180);

    return HttpResponse.json({
      session_id: sessionId,
      expires_at: expiresAt,
      expires_in_seconds: CHAT_SESSION_TTL_SECONDS,
      session_ttl_seconds: CHAT_SESSION_TTL_SECONDS,
    } satisfies ChatbotMessageResponse);
  }),

  http.get(`${CHATBOT_BASE_PATH}/stream`, async ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id')?.trim() ?? '';

    if (!sessionId) {
      return mockErrorResponse(400, '잘못된 session_id 입니다.');
    }

    const session = chatSessions.get(sessionId);

    if (!session) {
      return mockErrorResponse(
        404,
        '만료되었거나 유효하지 않은 session_id 입니다.',
      );
    }

    if (isExpiredSession(session)) {
      chatSessions.delete(sessionId);
      return mockErrorResponse(
        404,
        '만료되었거나 유효하지 않은 session_id 입니다.',
      );
    }

    return createStreamResponse(session);
  }),
];
