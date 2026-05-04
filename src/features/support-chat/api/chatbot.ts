import { apiBaseUrl } from '@/lib/env';
import type {
  ChatbotErrorResponse,
  ChatbotMessageRequest,
  ChatbotMessageResponse,
  ChatbotSessionMetadata,
  ChatbotStreamEvent,
} from '../types/supportChat';

// 고객센터 챗봇 전용 엔드포인트.
// 설문 챗봇(`/api/v1/survey/chatbot/*`)과 경로를 명확히 분리해 사용한다.
const CHATBOT_BASE_PATH = '/api/v1/chatbot';
const EXPIRED_CHATBOT_SESSION_MESSAGE =
  '만료되었거나 유효하지 않은 session_id 입니다.';
const STREAM_SESSION_NOT_FOUND_MESSAGE =
  '스트리밍 대상 세션을 찾을 수 없습니다.';
const INVALID_STREAM_SESSION_MESSAGE = '잘못된 session_id 입니다.';

class ChatbotRequestError extends Error {
  status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'ChatbotRequestError';
    this.status = status;
  }
}

const normalizeChatbotApiPath = (path: string) => {
  const prefixedPath = path.startsWith('/api/v1') ? path : `/api/v1${path}`;
  const normalizedPath = prefixedPath.replace(/\/+$/, '');

  return normalizedPath || CHATBOT_BASE_PATH;
};

const buildChatbotApiPath = (segment: 'messages' | 'stream') =>
  normalizeChatbotApiPath(`${CHATBOT_BASE_PATH}/${segment}`);

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
  context: 'message' | 'stream' = 'message',
) => {
  if (status === 400) {
    return context === 'stream'
      ? INVALID_STREAM_SESSION_MESSAGE
      : '메시지는 공백일 수 없고 2자 이상이어야 합니다.';
  }

  if (status === 404) {
    return context === 'stream'
      ? STREAM_SESSION_NOT_FOUND_MESSAGE
      : EXPIRED_CHATBOT_SESSION_MESSAGE;
  }

  if (status === 409) {
    return '이미 스트리밍이 진행 중입니다.';
  }

  if (status === 500) {
    return '서버 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return fallback;
};

const extractChatbotErrorMessage = async (
  response: Response,
  context: 'message' | 'stream' = 'message',
) => {
  try {
    const data = (await response.json()) as ChatbotErrorResponse;

    return (
      data.error_detail ||
      (typeof data.detail === 'string' ? data.detail : null) ||
      getDefaultChatbotErrorMessage(response.status, data.error_detail, context)
    );
  } catch {
    return getDefaultChatbotErrorMessage(response.status, undefined, context);
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
      credentials: 'omit',
      headers: createChatbotHeaders({
        accept: init.accept,
        contentType: init.contentType,
        extraHeaders: init.extraHeaders,
      }),
    });

  return request();
};

const toSessionMetadata = (
  payload: ChatbotSessionMetadata,
): ChatbotSessionMetadata => ({
  expires_at: payload.expires_at,
  expires_in_seconds: payload.expires_in_seconds,
  session_ttl_seconds: payload.session_ttl_seconds,
});

export const sendChatbotMessage = async (payload: ChatbotMessageRequest) => {
  const response = await fetchChatbotApi(
    createApiUrl(buildChatbotApiPath('messages')),
    {
      method: 'POST',
      accept: 'application/json',
      contentType: 'application/json',
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new ChatbotRequestError(
      await extractChatbotErrorMessage(response, 'message'),
      response.status,
    );
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
      ...toSessionMetadata(parsed),
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
      ...toSessionMetadata(parsed),
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
    createApiUrl(buildChatbotApiPath('stream'), { session_id: sessionId }),
    {
      method: 'GET',
      accept: 'text/event-stream',
      signal,
    },
  );

  if (!response.ok) {
    throw new ChatbotRequestError(
      await extractChatbotErrorMessage(response, 'stream'),
      response.status,
    );
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

  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return '실시간 응답 연결에 실패했습니다. 네트워크 또는 CORS 설정을 확인해 주세요.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '챗봇 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
};

export const isSupportChatSessionExpiredError = (error: unknown) => {
  if (error instanceof ChatbotRequestError) {
    return (
      error.status === 404 &&
      (error.message.includes('session_id') ||
        error.message.includes(STREAM_SESSION_NOT_FOUND_MESSAGE) ||
        error.message.includes(INVALID_STREAM_SESSION_MESSAGE))
    );
  }

  if (error instanceof Error) {
    return (
      error.message.includes(EXPIRED_CHATBOT_SESSION_MESSAGE) ||
      error.message.includes(STREAM_SESSION_NOT_FOUND_MESSAGE) ||
      error.message.includes(INVALID_STREAM_SESSION_MESSAGE)
    );
  }

  return false;
};

export const getSupportChatSessionRecoveryMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes(STREAM_SESSION_NOT_FOUND_MESSAGE)) {
      return '이전 대화 세션을 찾을 수 없어 새 대화를 시작했어요. 다시 질문해 주세요.';
    }

    if (
      error.message.includes(EXPIRED_CHATBOT_SESSION_MESSAGE) ||
      error.message.includes(INVALID_STREAM_SESSION_MESSAGE)
    ) {
      return '이전 대화 세션이 만료되어 새 대화를 시작했어요. 다시 질문해 주세요.';
    }
  }

  return '대화 세션을 다시 시작했어요. 질문을 다시 보내 주세요.';
};
