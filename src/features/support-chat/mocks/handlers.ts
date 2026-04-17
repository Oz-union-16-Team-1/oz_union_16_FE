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

const CHATBOT_BASE_PATH = '/api/v1/chatbot';

type MockChatSession = {
  id: number;
  lastReply: string;
};

const chatSessions = new Map<number, MockChatSession>();
let nextSessionId = 1;

const toJsonError = (status: number, message: string) =>
  HttpResponse.json(
    {
      error_detail: message,
    },
    { status },
  );

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

const createStreamResponse = (sessionId: number, reply: string) => {
  const encoder = new TextEncoder();
  const chunks = splitMessageIntoChunks(reply);

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
        await pushEvent('start', { session_id: sessionId });

        for (const chunk of chunks) {
          await delay(140);
          await pushEvent('chunk', { content: chunk });
        }

        await delay(100);
        await pushEvent('complete', { session_id: sessionId });
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
      return toJsonError(400, '메시지는 공백일 수 없고 2자 이상이어야 합니다.');
    }

    let sessionId = body.session_id;

    if (sessionId !== undefined && !chatSessions.has(sessionId)) {
      return toJsonError(404, '만료되었거나 유효하지 않은 session_id 입니다.');
    }

    if (sessionId === undefined) {
      sessionId = nextSessionId;
      nextSessionId += 1;
    }

    const matchedEntry = findSupportFaqEntry(message);
    const reply =
      matchedEntry?.answer ??
      buildSupportChatFallbackMessage(createDefaultRouteContext());

    chatSessions.set(sessionId, {
      id: sessionId,
      lastReply: reply,
    });

    await delay(180);

    return HttpResponse.json({
      session_id: sessionId,
    } satisfies ChatbotMessageResponse);
  }),

  http.get(`${CHATBOT_BASE_PATH}/stream`, async ({ request }) => {
    const url = new URL(request.url);
    const sessionId = Number(url.searchParams.get('session_id'));

    if (Number.isNaN(sessionId) || sessionId <= 0) {
      return toJsonError(400, '잘못된 session_id 입니다.');
    }

    const session = chatSessions.get(sessionId);

    if (!session) {
      return toJsonError(404, '스트리밍 대상 세션을 찾을 수 없습니다.');
    }

    return createStreamResponse(sessionId, session.lastReply);
  }),
];
