import { useCallback, useRef, useState } from 'react';

import {
  extractSupportChatErrorMessage,
  streamChatbotResponse,
} from '@/features/support-chat/api/chatbot';
import { useSendChatbotMessageMutation } from '@/features/support-chat/api/useSupportChatApi';
import { useSupportChatStore } from '@/features/support-chat/store/useSupportChatStore';
import type { SupportChatRouteContext } from '@/features/support-chat/types/supportChat';

const SUPPORT_CHAT_INPUT_VALIDATION_MESSAGE =
  '메시지는 공백일 수 없고 2자 이상이어야 합니다.';

const isRecoverableSessionError = (message: string) =>
  message.includes('session_id') || message.includes('유효하지 않은');

export type SupportChatConversationResetOptions = {
  routeContext?: SupportChatRouteContext;
  keepPanelOpen?: boolean;
  preserveBootstrap?: boolean;
  abortInFlightRequest?: boolean;
};

type UseSupportChatConversationParams = {
  routeContext: SupportChatRouteContext;
};

function useSupportChatConversation({
  routeContext,
}: UseSupportChatConversationParams) {
  const [inputValue, setInputValue] = useState('');
  const streamAbortRef = useRef<AbortController | null>(null);
  const requestGenerationRef = useRef(0);
  const sendMessageMutation = useSendChatbotMessageMutation();

  const {
    sessionId,
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
    setSessionId,
    setSubmitting,
    setPinnedToBottom,
  } = useSupportChatStore();

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

  const resetConversationState = useCallback(
    ({
      routeContext: nextRouteContext = routeContext,
      keepPanelOpen = true,
      preserveBootstrap = true,
      abortInFlightRequest = true,
    }: SupportChatConversationResetOptions = {}) => {
      if (abortInFlightRequest) {
        abortStreamingResponse(true);
      }

      setInputValue('');
      setPinnedToBottom(true);
      resetConversation(nextRouteContext, {
        isOpen: keepPanelOpen,
        hasBootstrapped: preserveBootstrap,
      });
    },
    [
      abortStreamingResponse,
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

      const assistantPlaceholderMessageId = crypto.randomUUID();
      const requestGeneration = requestGenerationRef.current;

      hideQuickActions();
      appendUserMessage(trimmedMessage);
      beginAssistantMessage(assistantPlaceholderMessageId);
      setSubmitting(true);

      try {
        let response;

        try {
          response = await sendMessageMutation.mutateAsync({
            message: trimmedMessage,
            session_id: sessionId ?? undefined,
          });
        } catch (requestError) {
          const errorMessage = extractSupportChatErrorMessage(requestError);

          if (requestGeneration !== requestGenerationRef.current) {
            return;
          }

          if (sessionId && isRecoverableSessionError(errorMessage)) {
            setSessionId(null);
            response = await sendMessageMutation.mutateAsync({
              message: trimmedMessage,
            });
          } else {
            throw requestError;
          }
        }

        if (requestGeneration !== requestGenerationRef.current) {
          return;
        }

        setSessionId(response.session_id);

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

            if (event.type === 'complete') {
              finalizeAssistantMessage(assistantPlaceholderMessageId);
              setSubmitting(false);
            }
          },
        });
      } catch (requestError) {
        if (requestGeneration !== requestGenerationRef.current) {
          return;
        }

        removeMessage(assistantPlaceholderMessageId);
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
      sessionId,
      setSessionId,
      setSubmitting,
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
    inputValue,
    setInputValue,
    handleSubmit,
    handleQuickActionSelect,
    resetConversationState,
    abortStreamingResponse,
  };
}

export default useSupportChatConversation;
