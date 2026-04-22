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
  sessionId: number | null;
  messages: SupportChatMessage[];
  quickActions: SupportChatQuickAction[];
  showQuickActions: boolean;
  hasBootstrapped: boolean;
  isPinnedToBottom: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  routeContext: SupportChatRouteContext;
  bootstrapConversation: (routeContext?: SupportChatRouteContext) => void;
  resetConversation: (routeContext?: SupportChatRouteContext) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setRouteContext: (routeContext: SupportChatRouteContext) => void;
  setSessionId: (sessionId: number | null) => void;
  setPinnedToBottom: (isPinnedToBottom: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  hideQuickActions: () => void;
  appendUserMessage: (content: string) => void;
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
  sessionId: null as number | null,
  messages: createInitialMessages(),
  quickActions: SUPPORT_CHAT_QUICK_ACTIONS,
  showQuickActions: true,
  hasBootstrapped: false,
  isPinnedToBottom: true,
  isOpen: false,
  isSubmitting: false,
  error: null as string | null,
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
    resetConversation: (routeContext = get().routeContext) =>
      set({
        ...initialState,
        hasBootstrapped: true,
        isOpen: true,
        routeContext,
      }),
    openPanel: () => set({ isOpen: true }),
    closePanel: () => set({ isOpen: false }),
    togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
    setRouteContext: (routeContext) => set({ routeContext }),
    setSessionId: (sessionId) => set({ sessionId }),
    setPinnedToBottom: (isPinnedToBottom) => set({ isPinnedToBottom }),
    setSubmitting: (isSubmitting) => set({ isSubmitting }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    hideQuickActions: () => set({ showQuickActions: false }),
    appendUserMessage: (content) =>
      set((state) => ({
        messages: capMessages([
          ...state.messages,
          createMessage('user', content),
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
