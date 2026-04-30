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
  if (status === 401) {
    return '챗봇 요청 권한이 없습니다.';
  }

  if (status === 400) {
    return '메시지는 공백일 수 없고 2자 이상이어야 합니다.';
  }

  if (status === 404) {
    return '만료되었거나 유효하지 않은 session_id 입니다.';
  }

  if (status === 409) {
    return '이미 스트리밍이 진행 중입니다.';
  }

  if (status === 500) {
    return '서버 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return fallback;
};

const extractChatbotErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as ChatbotErrorResponse;

    return (
      data.error_detail ||
      (typeof data.detail === 'string' ? data.detail : null) ||
      getDefaultChatbotErrorMessage(response.status, data.error_detail)
    );
  } catch {
    return getDefaultChatbotErrorMessage(response.status);
  }
};

const createChatbotHeaders = ({
  accept,
  contentType,
  extraHeaders,
}: {
  accept: string;
  contentType?: string;
  extraHeaders?: HeadersInit;
}) => {
  const headers = new Headers({
    Accept: accept,
  });

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (extraHeaders) {
    const normalizedExtraHeaders = new Headers(extraHeaders);

    normalizedExtraHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
};

const fetchChatbotApi = async (
  url: string,
  init: Omit<RequestInit, 'headers'> & {
    accept: string;
    contentType?: string;
    extraHeaders?: HeadersInit;
  },
) => {
  const request = async () =>
    fetch(url, {
      ...init,
      credentials: 'include',
      headers: createChatbotHeaders({
        accept: init.accept,
        contentType: init.contentType,
        extraHeaders: init.extraHeaders,
      }),
    });

  return request();
};

export const sendChatbotMessage = async (payload: ChatbotMessageRequest) => {
  const response = await fetchChatbotApi(
    createApiUrl(`${CHATBOT_BASE_PATH}/messages`),
    {
      method: 'POST',
      accept: 'application/json',
      contentType: 'application/json',
      body: JSON.stringify(payload),
    },
  );

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
      const rawValue = line.slice('data:'.length);
      dataLines.push(rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue);
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  let parsed: {
    session_id?: string;
    content?: string;
    expires_at?: string;
    expires_in_seconds?: number;
    session_ttl_seconds?: number;
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
      expiresAt: parsed.expires_at,
      expiresInSeconds: parsed.expires_in_seconds,
      sessionTtlSeconds: parsed.session_ttl_seconds,
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
  const response = await fetchChatbotApi(
    createApiUrl(`${CHATBOT_BASE_PATH}/stream`, { session_id: sessionId }),
    {
      method: 'GET',
      accept: 'text/event-stream',
      extraHeaders: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
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

  const contentType = response.headers.get('Content-Type')?.toLowerCase() ?? '';

  if (!contentType.includes('text/event-stream')) {
    throw new Error(
      '챗봇 스트림 응답 형식이 올바르지 않습니다. 서버 설정을 확인해주세요.',
    );
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
