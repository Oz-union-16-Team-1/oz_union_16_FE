import { create } from 'zustand';

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
  sessionId: string | null;
  messages: SurveyMessage[];
  status: SurveySessionStatus;
  progress: SurveyProgress;
  hasBootstrapped: boolean;
  isSubmitting: boolean;
  error: string | null;
  recommendationReady: boolean;
  lastSubmittedMessage: string | null;
  setHasBootstrapped: (hasBootstrapped: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLastSubmittedMessage: (message: string | null) => void;
  addUserMessage: (content: string) => void;
  hydrateInitialSession: (payload: SurveySessionStartResponse) => void;
  beginSession: (payload: SurveySessionStartResponse) => void;
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

const COMPLETION_GUIDE_MESSAGE =
  "추천 결과가 준비되었어요. 우측 상단의 '추천 결과 보기' 버튼을 눌러 바로 확인해 보세요.";

const initialState = {
  sessionId: null,
  messages: [] as SurveyMessage[],
  status: 'IDLE' as SurveySessionStatus,
  progress: DEFAULT_SURVEY_PROGRESS,
  hasBootstrapped: false,
  isSubmitting: false,
  error: null,
  recommendationReady: false,
  lastSubmittedMessage: null,
};

export const useSurveyStore = create<SurveyStoreState>((set) => ({
  ...initialState,
  setHasBootstrapped: (hasBootstrapped) => set({ hasBootstrapped }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setLastSubmittedMessage: (message) => set({ lastSubmittedMessage: message }),
  addUserMessage: (content) =>
    set((state) => ({
      messages: [...state.messages, createMessage('user', content)],
    })),
  hydrateInitialSession: (payload) =>
    set(() => ({
      sessionId: payload.session_id,
      status: payload.status,
      progress: payload.progress ?? { ...DEFAULT_SURVEY_PROGRESS },
      isSubmitting: false,
      hasBootstrapped: true,
      error: null,
      recommendationReady: false,
      lastSubmittedMessage: null,
      messages: payload.ai_question
        ? [createMessage('assistant', payload.ai_question)]
        : [],
    })),
  beginSession: (payload) =>
    set((state) => ({
      sessionId: payload.session_id,
      status: payload.status,
      progress: payload.progress ?? state.progress,
      hasBootstrapped: true,
      isSubmitting: false,
      error: null,
      recommendationReady: false,
      messages: payload.ai_question
        ? state.messages.at(-1)?.role === 'assistant' &&
          state.messages.at(-1)?.content === payload.ai_question
          ? state.messages
          : [...state.messages, createMessage('assistant', payload.ai_question)]
        : state.messages,
    })),
  applyChatResponse: (payload) =>
    set((state) => ({
      status: payload.status,
      progress: payload.progress,
      recommendationReady: payload.recommendation_ready,
      isSubmitting: false,
      error: null,
      messages: (() => {
        if (payload.ai_question) {
          return state.messages.at(-1)?.role === 'assistant' &&
            state.messages.at(-1)?.content === payload.ai_question
            ? state.messages
            : [
                ...state.messages,
                createMessage('assistant', payload.ai_question),
              ];
        }

        if (payload.recommendation_ready) {
          return state.messages.at(-1)?.role === 'assistant' &&
            state.messages.at(-1)?.content === COMPLETION_GUIDE_MESSAGE
            ? state.messages
            : [
                ...state.messages,
                createMessage('assistant', COMPLETION_GUIDE_MESSAGE),
              ];
        }

        return state.messages;
      })(),
    })),
  resetSurveyState: () => ({
    ...initialState,
    messages: [...initialState.messages],
    progress: { ...DEFAULT_SURVEY_PROGRESS },
  }),
}));
