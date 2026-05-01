import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_SURVEY_PROGRESS,
  type SurveyChatResponse,
  type SurveyMessage,
  type SurveyMessageRole,
  type SurveyProgress,
  type SurveySessionStartResponse,
  type SurveySessionStatus,
} from '../types/survey';

interface SurveyStoreState {
  pendingAction: 'start' | 'continue' | 'reset' | null;
  ownerKey: string | null;
  sessionId: string | null;
  messages: SurveyMessage[];
  status: SurveySessionStatus;
  progress: SurveyProgress;
  hasBootstrapped: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendationReady: boolean;
  lastSubmittedMessage: string | null;
  nonGameStrikeCount: number;
  chatBlockedUntil: number | null;
  syncOwnerKey: (ownerKey: string) => void;
  setPendingAction: (pendingAction: SurveyStoreState['pendingAction']) => void;
  setHasBootstrapped: (hasBootstrapped: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLastSubmittedMessage: (message: string | null) => void;
  setNonGameStrikeCount: (count: number) => void;
  setChatBlockedUntil: (timestamp: number | null) => void;
  clearModerationState: () => void;
  addUserMessage: (content: string) => void;
  hydrateInitialSession: (payload: SurveySessionStartResponse) => void;
  applyChatResponse: (payload: SurveyChatResponse) => void;
  resetSurveyState: () => void;
}

const createMessage = (
  role: SurveyMessageRole,
  content: string,
): SurveyMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  createdAt: new Date().toISOString(),
});

const SURVEY_INTRO_MESSAGE =
  '설문을 시작하기 전에 안내드릴게요.\n게임 취향, 플레이 스타일, 선호 장르 중심으로 답변해 주세요.\n구체적으로 적을수록 설문 흐름이 더 빠르게 정리될 수 있어요.\n게임과 관련 없는 질문을 3회 이상 반복하면 5분 동안 설문 기능을 사용할 수 없어요.';

const COMPLETION_GUIDE_MESSAGE =
  "추천 결과가 준비되었어요. 아래의 '추천 결과 바로 보기' 버튼을 눌러 확인해 보세요.";

const getInitialMessages = (payload: SurveySessionStartResponse) => {
  if (payload.assistant_message) {
    return [
      createMessage('assistant', SURVEY_INTRO_MESSAGE),
      createMessage('assistant', payload.assistant_message),
    ];
  }

  if (payload.recommendation_ready) {
    return [createMessage('assistant', COMPLETION_GUIDE_MESSAGE)];
  }

  return [];
};

const appendAssistantMessageIfNeeded = (
  messages: SurveyMessage[],
  content: string | null,
) => {
  if (!content) {
    return messages;
  }

  const lastMessage = messages.at(-1);

  if (lastMessage?.role === 'assistant' && lastMessage.content === content) {
    return messages;
  }

  return [...messages, createMessage('assistant', content)];
};

const getFollowUpAssistantMessage = (payload: SurveyChatResponse) => {
  if (payload.assistant_message) {
    return payload.assistant_message;
  }

  if (payload.recommendation_ready) {
    return COMPLETION_GUIDE_MESSAGE;
  }

  return null;
};

const getSessionStatePatch = (
  payload: SurveySessionStartResponse,
  ownerKey: string | null,
) => ({
  ownerKey,
  sessionId: payload.session_id,
  status: payload.status,
  progress: payload.progress ?? { ...DEFAULT_SURVEY_PROGRESS },
  hasBootstrapped: true,
  isSubmitting: false,
  error: null,
  recommendationReady: payload.recommendation_ready,
  lastSubmittedMessage: null,
  nonGameStrikeCount: 0,
  chatBlockedUntil: null,
});

const createInitialState = (ownerKey: string | null = null) => ({
  pendingAction: null as SurveyStoreState['pendingAction'],
  ownerKey,
  sessionId: null,
  messages: [] as SurveyMessage[],
  status: 'IDLE' as SurveySessionStatus,
  progress: { ...DEFAULT_SURVEY_PROGRESS },
  hasBootstrapped: false,
  isSubmitting: false,
  error: null,
  recommendationReady: false,
  lastSubmittedMessage: null,
  nonGameStrikeCount: 0,
  chatBlockedUntil: null,
});

export const useSurveyStore = create<SurveyStoreState>()(
  persist(
    (set) => ({
      ...createInitialState(),
      syncOwnerKey: (ownerKey) =>
        set((state) =>
          state.ownerKey === ownerKey
            ? state
            : {
                ...createInitialState(ownerKey),
              },
        ),
      setPendingAction: (pendingAction) => set({ pendingAction }),
      setHasBootstrapped: (hasBootstrapped) => set({ hasBootstrapped }),
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLastSubmittedMessage: (message) =>
        set({ lastSubmittedMessage: message }),
      setNonGameStrikeCount: (count) => set({ nonGameStrikeCount: count }),
      setChatBlockedUntil: (timestamp) => set({ chatBlockedUntil: timestamp }),
      clearModerationState: () =>
        set({
          nonGameStrikeCount: 0,
          chatBlockedUntil: null,
        }),
      addUserMessage: (content) =>
        set((state) => ({
          messages: [...state.messages, createMessage('user', content)],
        })),
      hydrateInitialSession: (payload) =>
        set((state) => ({
          ...getSessionStatePatch(payload, state.ownerKey),
          messages: getInitialMessages(payload),
        })),
      applyChatResponse: (payload) =>
        set((state) => ({
          status: payload.status,
          progress: payload.progress,
          recommendationReady: payload.recommendation_ready,
          isSubmitting: false,
          error: null,
          messages: appendAssistantMessageIfNeeded(
            state.messages,
            getFollowUpAssistantMessage(payload),
          ),
        })),
      resetSurveyState: () =>
        set((state) => ({
          ...createInitialState(state.ownerKey),
        })),
    }),
    {
      name: 'survey-storage',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        ownerKey: state.ownerKey,
        sessionId: state.sessionId,
        messages: state.messages,
        status: state.status,
        progress: state.progress,
        hasBootstrapped: state.hasBootstrapped,
        recommendationReady: state.recommendationReady,
        lastSubmittedMessage: state.lastSubmittedMessage,
        nonGameStrikeCount: state.nonGameStrikeCount,
        chatBlockedUntil: state.chatBlockedUntil,
      }),
    },
  ),
);
