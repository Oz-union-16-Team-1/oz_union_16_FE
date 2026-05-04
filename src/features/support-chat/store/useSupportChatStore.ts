import { create } from 'zustand';

import {
  createDefaultRouteContext,
  SUPPORT_CHAT_QUICK_ACTIONS,
  SUPPORT_CHAT_WELCOME_MESSAGE,
} from '../data/faqs';
import type {
  SupportChatMessage,
  SupportChatQuickAction,
  SupportChatRouteContext,
} from '../types/supportChat';

type SupportChatStoreState = {
  sessionId: string | null;
  sessionExpiresAt: string | null;
  sessionExpiresInSeconds: number | null;
  sessionTtlSeconds: number | null;
  messages: SupportChatMessage[];
  quickActions: SupportChatQuickAction[];
  showQuickActions: boolean;
  hasBootstrapped: boolean;
  isPinnedToBottom: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  routeContext: SupportChatRouteContext;
  bootstrapConversation: (routeContext?: SupportChatRouteContext) => void;
  resetConversation: (
    routeContext?: SupportChatRouteContext,
    options?: {
      isOpen?: boolean;
      hasBootstrapped?: boolean;
    },
  ) => void;
  openPanel: () => void;
  closeAndResetConversation: (routeContext?: SupportChatRouteContext) => void;
  togglePanel: () => void;
  setRouteContext: (routeContext: SupportChatRouteContext) => void;
  setSessionState: (session: {
    sessionId: string | null;
    expiresAt?: string | null;
    expiresInSeconds?: number | null;
    sessionTtlSeconds?: number | null;
  }) => void;
  clearSession: () => void;
  setPinnedToBottom: (isPinnedToBottom: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  hideQuickActions: () => void;
  appendUserMessage: (content: string) => void;
  appendAssistantMessage: (content: string) => void;
  beginAssistantMessage: (messageId: string) => void;
  appendAssistantChunk: (messageId: string, chunk: string) => void;
  finalizeAssistantMessage: (messageId: string) => void;
  removeMessage: (messageId: string) => void;
};

const SUPPORT_CHAT_MESSAGE_CAP = 100;

const createMessage = (
  role: SupportChatMessage['role'],
  content: string,
  status: SupportChatMessage['status'] = 'complete',
  messageId: string = crypto.randomUUID(),
): SupportChatMessage => ({
  id: messageId,
  role,
  content,
  createdAt: new Date().toISOString(),
  status,
});

const createInitialMessages = () => [
  createMessage('assistant', SUPPORT_CHAT_WELCOME_MESSAGE),
];

const capMessages = (messages: SupportChatMessage[]) =>
  messages.length > SUPPORT_CHAT_MESSAGE_CAP
    ? messages.slice(-SUPPORT_CHAT_MESSAGE_CAP)
    : messages;

const initialState = {
  sessionId: null as string | null,
  sessionExpiresAt: null as string | null,
  sessionExpiresInSeconds: null as number | null,
  sessionTtlSeconds: null as number | null,
  messages: createInitialMessages(),
  quickActions: SUPPORT_CHAT_QUICK_ACTIONS,
  showQuickActions: true,
  hasBootstrapped: false,
  isPinnedToBottom: true,
  isOpen: false,
  isSubmitting: false,
  routeContext: createDefaultRouteContext(),
};

// 고객센터 챗봇 대화는 화면 한정 임시 상태로만 유지한다.
// 보안 정책상 persist/sessionStorage/localStorage를 사용하지 않는다.
export const useSupportChatStore = create<SupportChatStoreState>()(
  (set, get) => ({
    ...initialState,
    bootstrapConversation: (routeContext = get().routeContext) => {
      const state = get();

      if (state.hasBootstrapped) {
        if (routeContext.pathname !== state.routeContext.pathname) {
          set({ routeContext });
        }

        return;
      }

      set({
        ...initialState,
        hasBootstrapped: true,
        routeContext,
      });
    },
    resetConversation: (routeContext = get().routeContext, options = {}) =>
      set({
        ...initialState,
        hasBootstrapped: options.hasBootstrapped ?? true,
        isOpen: options.isOpen ?? true,
        routeContext,
      }),
    openPanel: () => set({ isOpen: true }),
    closeAndResetConversation: (routeContext = get().routeContext) =>
      set({
        ...initialState,
        routeContext,
      }),
    togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
    setRouteContext: (routeContext) => set({ routeContext }),
    setSessionState: ({
      sessionId,
      expiresAt = null,
      expiresInSeconds = null,
      sessionTtlSeconds = null,
    }) =>
      set({
        sessionId,
        sessionExpiresAt: expiresAt,
        sessionExpiresInSeconds: expiresInSeconds,
        sessionTtlSeconds,
      }),
    clearSession: () =>
      set({
        sessionId: null,
        sessionExpiresAt: null,
        sessionExpiresInSeconds: null,
        sessionTtlSeconds: null,
      }),
    setPinnedToBottom: (isPinnedToBottom) => set({ isPinnedToBottom }),
    setSubmitting: (isSubmitting) => set({ isSubmitting }),
    hideQuickActions: () => set({ showQuickActions: false }),
    appendUserMessage: (content) =>
      set((state) => ({
        messages: capMessages([
          ...state.messages,
          createMessage('user', content),
        ]),
      })),
    appendAssistantMessage: (content) =>
      set((state) => ({
        messages: capMessages([
          ...state.messages,
          createMessage('assistant', content),
        ]),
      })),
    beginAssistantMessage: (messageId) =>
      set((state) => ({
        messages: capMessages([
          ...state.messages,
          createMessage('assistant', '', 'streaming', messageId),
        ]),
      })),
    appendAssistantChunk: (messageId, chunk) =>
      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: `${message.content}${chunk}`,
              }
            : message,
        ),
      })),
    finalizeAssistantMessage: (messageId) =>
      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status: 'complete',
              }
            : message,
        ),
      })),
    removeMessage: (messageId) =>
      set((state) => ({
        messages: state.messages.filter((message) => message.id !== messageId),
      })),
  }),
);
