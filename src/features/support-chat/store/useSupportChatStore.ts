import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// import {
//   createDefaultRouteContext,
//   SUPPORT_CHAT_QUICK_ACTIONS,
//   SUPPORT_CHAT_WELCOME_MESSAGE,
// } from '../data/faqs';
import type {
  SupportChatMessage,
  SupportChatQuickAction,
  SupportChatRouteContext,
} from '../types/supportChat';

// Temporary placeholders to fix build errors until PR #74 is merged
const createDefaultRouteContext = (): SupportChatRouteContext => ({
  pathname: '/',
  pageLabel: '홈',
});
const SUPPORT_CHAT_QUICK_ACTIONS: SupportChatQuickAction[] = [];
const SUPPORT_CHAT_WELCOME_MESSAGE = '안녕하세요! 무엇을 도와드릴까요?';

type SupportChatStoreState = {
  sessionId: number | null;
  messages: SupportChatMessage[];
  quickActions: SupportChatQuickAction[];
  showQuickActions: boolean;
  hasBootstrapped: boolean;
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

const STORAGE_KEY = 'support-chat-storage';

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

const initialState = {
  sessionId: null as number | null,
  messages: createInitialMessages(),
  quickActions: SUPPORT_CHAT_QUICK_ACTIONS,
  showQuickActions: true,
  hasBootstrapped: true,
  isOpen: false,
  isSubmitting: false,
  error: null as string | null,
  routeContext: createDefaultRouteContext(),
};

export const useSupportChatStore = create<SupportChatStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      bootstrapConversation: (routeContext = get().routeContext) => {
        const state = get();

        if (state.hasBootstrapped && state.messages.length > 0) {
          if (routeContext.pathname !== state.routeContext.pathname) {
            set({ routeContext });
          }

          return;
        }

        set({
          ...initialState,
          routeContext,
        });
      },
      resetConversation: (routeContext = get().routeContext) =>
        set({
          ...initialState,
          isOpen: true,
          routeContext,
        }),
      openPanel: () => set({ isOpen: true }),
      closePanel: () => set({ isOpen: false }),
      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
      setRouteContext: (routeContext) => set({ routeContext }),
      setSessionId: (sessionId) => set({ sessionId }),
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      hideQuickActions: () => set({ showQuickActions: false }),
      appendUserMessage: (content) =>
        set((state) => ({
          messages: [...state.messages, createMessage('user', content)],
        })),
      beginAssistantMessage: (messageId) =>
        set((state) => ({
          messages: [
            ...state.messages,
            createMessage('assistant', '', 'streaming', messageId),
          ],
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
          messages: state.messages.filter(
            (message) => message.id !== messageId,
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages,
        quickActions: state.quickActions,
        showQuickActions: state.showQuickActions,
        hasBootstrapped: state.hasBootstrapped,
        routeContext: state.routeContext,
      }),
      merge: (persistedState, currentState) => {
        const mergedState = {
          ...currentState,
          ...(persistedState as Partial<typeof currentState>),
        };

        return {
          ...mergedState,
          isOpen: false,
          isSubmitting: false,
          error: null,
        };
      },
    },
  ),
);
