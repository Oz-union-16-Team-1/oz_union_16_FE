export type SupportChatMessageRole = 'assistant' | 'user';

export type SupportChatMessageStatus = 'streaming' | 'complete';

export type SupportChatMessage = {
  id: string;
  role: SupportChatMessageRole;
  content: string;
  createdAt: string;
  status: SupportChatMessageStatus;
};

export type SupportChatQuickAction = {
  id: string;
  label: string;
};

export type SupportChatRouteContext = {
  pathname: string;
  pageLabel: string;
};

export type ChatbotMessageRequest = {
  message: string;
};

export type ChatbotMessageResponse = {
  session_id: string;
  expires_at?: string;
  expires_in_seconds?: number;
  session_ttl_seconds?: number;
};

export type ChatbotErrorResponse = {
  error_detail: string;
  detail?: string | Record<string, string[]>;
};

export type ChatbotStreamStartEvent = {
  type: 'start';
  sessionId: string;
  expiresAt?: string;
  expiresInSeconds?: number;
  sessionTtlSeconds?: number;
};

export type ChatbotStreamChunkEvent = {
  type: 'chunk';
  content: string;
};

export type ChatbotStreamCompleteEvent = {
  type: 'complete';
  sessionId: string;
};

export type ChatbotStreamEvent =
  | ChatbotStreamStartEvent
  | ChatbotStreamChunkEvent
  | ChatbotStreamCompleteEvent;
