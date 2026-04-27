import { apiBaseUrl } from '@/lib/env';
import type {
  ChatbotErrorResponse,
  ChatbotMessageRequest,
  ChatbotMessageResponse,
  ChatbotStreamEvent,
} from '../types/supportChat';

// 고객센터 챗봇 전용 엔드포인트.
// 설문 챗봇(`/api/v1/survey/chatbot/*`)과 경로를 명확히 분리해 사용한다.
const CHATBOT_BASE_PATH = '/api/v1/chatbot';

const createApiUrl = (
  path: string,
  params?: Record<string, string | number | undefined>,
) => {
  const base =
    apiBaseUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost');
  const url = new URL(path, base);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  if (apiBaseUrl) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
};

const getDefaultChatbotErrorMessage = (
  status: number | null,
  fallback = '챗봇 요청을 처리하는 중 오류가 발생했습니다.',
) => {
  if (status === 400) {
    return '메시지는 공백일 수 없고 2자 이상이어야 합니다.';
  }

  if (status === 404) {
    return '만료되었거나 유효하지 않은 대화 세션입니다.';
  }

  return fallback;
};

const extractChatbotErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as ChatbotErrorResponse;

    return (
      data.error_detail ||
      getDefaultChatbotErrorMessage(response.status, data.error_detail)
    );
  } catch {
    return getDefaultChatbotErrorMessage(response.status);
  }
};

export const sendChatbotMessage = async (payload: ChatbotMessageRequest) => {
  const response = await fetch(createApiUrl(`${CHATBOT_BASE_PATH}/messages`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extractChatbotErrorMessage(response));
  }

  return (await response.json()) as ChatbotMessageResponse;
};

const parseSseEvent = (chunk: string): ChatbotStreamEvent | null => {
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.replace('event:', '').trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.replace('data:', '').trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  let parsed: {
    session_id?: string;
    content?: string;
  };

  try {
    parsed = JSON.parse(dataLines.join('\n')) as {
      session_id?: string;
      content?: string;
    };
  } catch (error) {
    // 일부 malformed chunk가 와도 스트림 전체를 중단하지 않고 해당 이벤트만 건너뛴다.
    if (import.meta.env.DEV) {
      console.warn('[support-chat] SSE 이벤트 파싱에 실패했습니다.', error);
    }

    return null;
  }

  if (eventName === 'start' && typeof parsed.session_id === 'string') {
    return {
      type: 'start',
      sessionId: parsed.session_id,
    };
  }

  if (eventName === 'chunk' && typeof parsed.content === 'string') {
    return {
      type: 'chunk',
      content: parsed.content,
    };
  }

  if (eventName === 'complete' && typeof parsed.session_id === 'string') {
    return {
      type: 'complete',
      sessionId: parsed.session_id,
    };
  }

  return null;
};

export const streamChatbotResponse = async ({
  sessionId,
  signal,
  onEvent,
}: {
  sessionId: string;
  signal?: AbortSignal;
  onEvent: (event: ChatbotStreamEvent) => void;
}) => {
  const response = await fetch(
    createApiUrl(`${CHATBOT_BASE_PATH}/stream`, { session_id: sessionId }),
    {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(await extractChatbotErrorMessage(response));
  }

  if (!response.body) {
    throw new Error('챗봇 응답 스트림을 불러오지 못했습니다.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

    while (buffer.includes('\n\n')) {
      const separatorIndex = buffer.indexOf('\n\n');
      const eventBlock = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (!eventBlock) {
        continue;
      }

      const parsedEvent = parseSseEvent(eventBlock);

      if (parsedEvent) {
        onEvent(parsedEvent);
      }
    }
  }

  const tail = buffer.trim();

  if (tail) {
    const parsedEvent = parseSseEvent(tail);

    if (parsedEvent) {
      onEvent(parsedEvent);
    }
  }
};

export const extractSupportChatErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '챗봇 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
};
