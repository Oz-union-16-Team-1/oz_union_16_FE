import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  extractSupportChatErrorMessage,
  streamChatbotResponse,
} from '@/features/support-chat/api/chatbot';
import { useSendChatbotMessageMutation } from '@/features/support-chat/api/useSupportChatApi';
import type { SupportChatRouteContext } from '@/features/support-chat/types/supportChat';

const SUPPORT_CHAT_INPUT_VALIDATION_MESSAGE =
  '메시지는 공백일 수 없고 2자 이상이어야 합니다.';

const isRecoverableSessionError = (message: string) =>
  message.includes('session_id') || message.includes('유효하지 않은');

type UseSupportChatConversationParams = {
  routeContext: SupportChatRouteContext;
  sessionId: number | null;
  isSubmitting: boolean;
  appendUserMessage: (content: string) => void;
  appendAssistantMessage: (content: string) => void;
  beginAssistantMessage: (messageId: string) => void;
  appendAssistantChunk: (messageId: string, chunk: string) => void;
  finalizeAssistantMessage: (messageId: string) => void;
  removeMessage: (messageId: string) => void;
  hideQuickActions: () => void;
  resetConversation: (routeContext?: SupportChatRouteContext) => void;
  setSessionId: (sessionId: number | null) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setPinnedToBottom: (isPinnedToBottom: boolean) => void;
  setHasUnreadMessages: Dispatch<SetStateAction<boolean>>;
};

function useSupportChatConversation({
  routeContext,
  sessionId,
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
  setHasUnreadMessages,
}: UseSupportChatConversationParams) {
  const [inputValue, setInputValue] = useState('');
  const streamAbortRef = useRef<AbortController | null>(null);
  const sendMessageMutation = useSendChatbotMessageMutation();

  const abortStreamingResponse = useCallback(
    (resetSubmitting = false) => {
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

          if (sessionId && isRecoverableSessionError(errorMessage)) {
            setSessionId(null);
            response = await sendMessageMutation.mutateAsync({
              message: trimmedMessage,
            });
          } else {
            throw requestError;
          }
        }

        setSessionId(response.session_id);

        const abortController = new AbortController();
        streamAbortRef.current = abortController;

        await streamChatbotResponse({
          sessionId: response.session_id,
          signal: abortController.signal,
          onEvent: (event) => {
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
        removeMessage(assistantPlaceholderMessageId);
        const errorMessage = extractSupportChatErrorMessage(requestError);

        if (errorMessage) {
          appendAssistantErrorMessage(errorMessage);
        }

        setSubmitting(false);
      } finally {
        streamAbortRef.current = null;
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

  const handleReset = useCallback(() => {
    abortStreamingResponse(true);
    setInputValue('');
    setHasUnreadMessages(false);
    setPinnedToBottom(true);
    resetConversation(routeContext);
  }, [
    abortStreamingResponse,
    resetConversation,
    routeContext,
    setHasUnreadMessages,
    setPinnedToBottom,
  ]);

  return {
    inputValue,
    setInputValue,
    handleSubmit,
    handleQuickActionSelect,
    handleReset,
    abortStreamingResponse,
  };
}

export default useSupportChatConversation;
