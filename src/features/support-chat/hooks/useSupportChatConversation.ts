import { useCallback, useEffect, useRef, useState } from 'react';

import {
  extractSupportChatErrorMessage,
  getSupportChatSessionRecoveryMessage,
  isSupportChatSessionExpiredError,
  streamChatbotResponse,
} from '@/features/support-chat/api/chatbot';
import { useSendChatbotMessageMutation } from '@/features/support-chat/api/useSupportChatApi';
import { useSupportChatStore } from '@/features/support-chat/store/useSupportChatStore';
import type {
  ChatbotSessionMetadata,
  SupportChatRouteContext,
} from '@/features/support-chat/types/supportChat';

const SUPPORT_CHAT_INPUT_VALIDATION_MESSAGE =
  '메시지는 공백일 수 없고 2자 이상이어야 합니다.';
const SUPPORT_CHAT_SESSION_RESET_NOTICE =
  '30분 동안 입력이 없어 대화 세션이 종료되었어요. 다시 질문해 주세요.';

export type SupportChatConversationResetOptions = {
  routeContext?: SupportChatRouteContext;
  keepPanelOpen?: boolean;
  preserveBootstrap?: boolean;
  abortInFlightRequest?: boolean;
};

type UseSupportChatConversationParams = {
  routeContext: SupportChatRouteContext;
};

const resolveSessionTimeoutMs = ({
  expires_at,
  expires_in_seconds,
  session_ttl_seconds,
}: ChatbotSessionMetadata) => {
  if (expires_at) {
    const expiresAtTimestamp = Date.parse(expires_at);

    if (Number.isFinite(expiresAtTimestamp)) {
      return Math.max(expiresAtTimestamp - Date.now(), 0);
    }
  }

  const fallbackSeconds =
    typeof expires_in_seconds === 'number' && expires_in_seconds > 0
      ? expires_in_seconds
      : typeof session_ttl_seconds === 'number' && session_ttl_seconds > 0
        ? session_ttl_seconds
        : null;

  return fallbackSeconds ? fallbackSeconds * 1000 : null;
};

function useSupportChatConversation({
  routeContext,
}: UseSupportChatConversationParams) {
  const [inputValue, setInputValue] = useState('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const sessionResetTimeoutRef = useRef<number | null>(null);
  const requestGenerationRef = useRef(0);
  const sendMessageMutation = useSendChatbotMessageMutation();

  const {
    sessionId,
    sessionExpiresAt,
    sessionExpiresInSeconds,
    sessionTtlSeconds,
    messages,
    quickActions,
    showQuickActions,
    isSubmitting,
    appendUserMessage,
    appendAssistantMessage,
    beginAssistantMessage,
    appendAssistantChunk,
    finalizeAssistantMessage,
    removeMessage,
    hideQuickActions,
    resetConversation,
    setSessionState,
    setSubmitting,
    setPinnedToBottom,
  } = useSupportChatStore();

  const clearSessionResetTimeout = useCallback(() => {
    if (sessionResetTimeoutRef.current !== null) {
      window.clearTimeout(sessionResetTimeoutRef.current);
      sessionResetTimeoutRef.current = null;
    }
  }, []);

  const abortStreamingResponse = useCallback(
    (resetSubmitting = false) => {
      requestGenerationRef.current += 1;

      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }

      if (resetSubmitting) {
        setSubmitting(false);
      }
    },
    [setSubmitting],
  );

  const syncSessionState = useCallback(
    ({
      session_id,
      expires_at,
      expires_in_seconds,
      session_ttl_seconds,
    }: {
      session_id: string;
      expires_at?: string;
      expires_in_seconds?: number;
      session_ttl_seconds?: number;
    }) => {
      setSessionState({
        sessionId: session_id,
        expiresAt: expires_at ?? null,
        expiresInSeconds: expires_in_seconds ?? null,
        sessionTtlSeconds: session_ttl_seconds ?? null,
      });
    },
    [setSessionState],
  );

  const resetConversationState = useCallback(
    ({
      routeContext: nextRouteContext = routeContext,
      keepPanelOpen = true,
      preserveBootstrap = true,
      abortInFlightRequest = true,
    }: SupportChatConversationResetOptions = {}) => {
      clearSessionResetTimeout();

      if (abortInFlightRequest) {
        abortStreamingResponse(true);
      }

      setInputValue('');
      setSessionNotice(null);
      setPinnedToBottom(true);
      resetConversation(nextRouteContext, {
        isOpen: keepPanelOpen,
        hasBootstrapped: preserveBootstrap,
      });
    },
    [
      abortStreamingResponse,
      clearSessionResetTimeout,
      resetConversation,
      routeContext,
      setPinnedToBottom,
    ],
  );

  const appendAssistantErrorMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        return;
      }

      hideQuickActions();
      appendAssistantMessage(trimmedMessage);
    },
    [appendAssistantMessage, hideQuickActions],
  );

  const handleSessionTimeout = useCallback(() => {
    const { isOpen: isPanelOpen } = useSupportChatStore.getState();

    resetConversationState({
      routeContext,
      keepPanelOpen: isPanelOpen,
      preserveBootstrap: true,
      abortInFlightRequest: true,
    });
    setSessionNotice(SUPPORT_CHAT_SESSION_RESET_NOTICE);
  }, [resetConversationState, routeContext]);

  useEffect(() => {
    clearSessionResetTimeout();

    if (!sessionId) {
      return;
    }

    const timeoutMs = resolveSessionTimeoutMs({
      expires_at: sessionExpiresAt ?? undefined,
      expires_in_seconds: sessionExpiresInSeconds ?? undefined,
      session_ttl_seconds: sessionTtlSeconds ?? undefined,
    });

    if (timeoutMs === null) {
      return;
    }

    sessionResetTimeoutRef.current = window.setTimeout(
      () => {
        handleSessionTimeout();
      },
      Math.max(timeoutMs, 0),
    );

    return clearSessionResetTimeout;
  }, [
    clearSessionResetTimeout,
    handleSessionTimeout,
    sessionExpiresAt,
    sessionExpiresInSeconds,
    sessionId,
    sessionTtlSeconds,
  ]);

  useEffect(
    () => () => {
      clearSessionResetTimeout();
      abortStreamingResponse();
    },
    [abortStreamingResponse, clearSessionResetTimeout],
  );

  const submitMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();

      if (trimmedMessage.length < 2) {
        appendAssistantErrorMessage(SUPPORT_CHAT_INPUT_VALIDATION_MESSAGE);
        return;
      }

      if (isSubmitting) {
        return;
      }

      setSessionNotice(null);
      const assistantPlaceholderMessageId = crypto.randomUUID();
      const requestGeneration = requestGenerationRef.current;

      hideQuickActions();
      appendUserMessage(trimmedMessage);
      beginAssistantMessage(assistantPlaceholderMessageId);
      setSubmitting(true);

      try {
        const activeSessionId = useSupportChatStore.getState().sessionId;

        const response = await sendMessageMutation.mutateAsync({
          message: trimmedMessage,
          session_id: activeSessionId ?? undefined,
        });

        if (requestGeneration !== requestGenerationRef.current) {
          return;
        }

        syncSessionState(response);

        const abortController = new AbortController();
        streamAbortRef.current = abortController;

        await streamChatbotResponse({
          sessionId: response.session_id,
          signal: abortController.signal,
          onEvent: (event) => {
            if (requestGeneration !== requestGenerationRef.current) {
              return;
            }

            if (event.type === 'chunk') {
              appendAssistantChunk(
                assistantPlaceholderMessageId,
                event.content,
              );
            }

            if (event.type === 'start') {
              syncSessionState({
                session_id: event.sessionId,
                expires_at: event.expires_at,
                expires_in_seconds: event.expires_in_seconds,
                session_ttl_seconds: event.session_ttl_seconds,
              });
            }

            if (event.type === 'complete') {
              syncSessionState({
                session_id: event.sessionId,
                expires_at: event.expires_at,
                expires_in_seconds: event.expires_in_seconds,
                session_ttl_seconds: event.session_ttl_seconds,
              });
              finalizeAssistantMessage(assistantPlaceholderMessageId);
              setSubmitting(false);
            }
          },
        });

        if (requestGeneration !== requestGenerationRef.current) {
          return;
        }

        finalizeAssistantMessage(assistantPlaceholderMessageId);
        setSubmitting(false);
      } catch (requestError) {
        if (requestGeneration !== requestGenerationRef.current) {
          return;
        }

        removeMessage(assistantPlaceholderMessageId);

        if (isSupportChatSessionExpiredError(requestError)) {
          const recoveryMessage =
            getSupportChatSessionRecoveryMessage(requestError);
          const { isOpen: isPanelOpen } = useSupportChatStore.getState();

          resetConversationState({
            routeContext,
            keepPanelOpen: isPanelOpen,
            preserveBootstrap: true,
            abortInFlightRequest: true,
          });
          setSessionNotice(recoveryMessage);
          return;
        }

        const errorMessage = extractSupportChatErrorMessage(requestError);

        if (errorMessage) {
          appendAssistantErrorMessage(errorMessage);
        }

        setSubmitting(false);
      } finally {
        if (requestGeneration === requestGenerationRef.current) {
          streamAbortRef.current = null;
        }
      }
    },
    [
      appendAssistantChunk,
      appendAssistantErrorMessage,
      appendUserMessage,
      beginAssistantMessage,
      finalizeAssistantMessage,
      hideQuickActions,
      isSubmitting,
      removeMessage,
      sendMessageMutation,
      setSubmitting,
      resetConversationState,
      routeContext,
      syncSessionState,
    ],
  );

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) {
      appendAssistantErrorMessage(SUPPORT_CHAT_INPUT_VALIDATION_MESSAGE);
      return;
    }

    const nextValue = inputValue;
    setInputValue('');
    await submitMessage(nextValue);
  }, [appendAssistantErrorMessage, inputValue, submitMessage]);

  const handleQuickActionSelect = useCallback(
    async (label: string) => {
      await submitMessage(label);
    },
    [submitMessage],
  );

  return {
    messages,
    quickActions,
    showQuickActions,
    isSubmitting,
    sessionNotice,
    inputValue,
    setInputValue,
    dismissSessionNotice: () => {
      setSessionNotice(null);
    },
    handleSubmit,
    handleQuickActionSelect,
    resetConversationState,
    abortStreamingResponse,
  };
}

export default useSupportChatConversation;
