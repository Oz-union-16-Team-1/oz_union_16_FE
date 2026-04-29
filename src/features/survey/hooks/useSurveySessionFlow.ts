import { useCallback, useEffect } from 'react';

import { isMockServiceWorkerEnabled } from '../../../lib/env';
import {
  useContinueSurveyMutation,
  useResetSurveyMutation,
  useStartSurveySessionMutation,
} from '../api/useSurveyApi';
import {
  extractApiErrorMessage,
  extractApiRetryAfterSeconds,
} from '../api/survey';
import { useSurveyStore } from '../store/useSurveyStore';

const isRecoverableMockSessionError = (message: string | null) =>
  isMockServiceWorkerEnabled() &&
  Boolean(
    message &&
    (message.includes('해당 세션') || message.includes('설문 세션이 만료')),
  );

type UseSurveySessionFlowOptions = {
  queueFocusRestore: () => void;
  cancelFocusRestore: () => void;
};

export const useSurveySessionFlow = ({
  queueFocusRestore,
  cancelFocusRestore,
}: UseSurveySessionFlowOptions) => {
  const sessionId = useSurveyStore((state) => state.sessionId);
  const hasBootstrapped = useSurveyStore((state) => state.hasBootstrapped);
  const isSubmitting = useSurveyStore((state) => state.isSubmitting);
  const error = useSurveyStore((state) => state.error);
  const lastSubmittedMessage = useSurveyStore(
    (state) => state.lastSubmittedMessage,
  );
  const clearError = useSurveyStore((state) => state.clearError);
  const setHasBootstrapped = useSurveyStore(
    (state) => state.setHasBootstrapped,
  );
  const setSubmitting = useSurveyStore((state) => state.setSubmitting);
  const setError = useSurveyStore((state) => state.setError);
  const setLastSubmittedMessage = useSurveyStore(
    (state) => state.setLastSubmittedMessage,
  );
  const clearModerationState = useSurveyStore(
    (state) => state.clearModerationState,
  );
  const setChatBlockedUntil = useSurveyStore(
    (state) => state.setChatBlockedUntil,
  );
  const addUserMessage = useSurveyStore((state) => state.addUserMessage);
  const hydrateInitialSession = useSurveyStore(
    (state) => state.hydrateInitialSession,
  );
  const applyChatResponse = useSurveyStore((state) => state.applyChatResponse);
  const resetSurveyState = useSurveyStore((state) => state.resetSurveyState);

  const startSessionMutation = useStartSurveySessionMutation();
  const continueSurveyMutation = useContinueSurveyMutation();
  const resetSurveyMutation = useResetSurveyMutation();

  const bootstrapSurvey = useCallback(
    async (force = false) => {
      if ((hasBootstrapped && !force) || (isSubmitting && !force)) {
        return;
      }

      clearError();
      resetSurveyState();
      setHasBootstrapped(true);
      setSubmitting(true);

      try {
        const response = await startSessionMutation.mutateAsync({
          is_reset: false,
        });
        hydrateInitialSession(response);
      } catch (requestError) {
        setHasBootstrapped(false);
        setError(extractApiErrorMessage(requestError));
      } finally {
        setSubmitting(false);
      }
    },
    [
      clearError,
      hasBootstrapped,
      hydrateInitialSession,
      isSubmitting,
      resetSurveyState,
      setError,
      setHasBootstrapped,
      setSubmitting,
      startSessionMutation,
    ],
  );

  useEffect(() => {
    if (!sessionId && !hasBootstrapped) {
      void bootstrapSurvey();
    }
  }, [bootstrapSurvey, hasBootstrapped, sessionId]);

  const applyServerSideChatBlock = useCallback(
    (requestError: unknown) => {
      const retryAfterSeconds = extractApiRetryAfterSeconds(requestError);

      if (retryAfterSeconds === null) {
        return;
      }

      setChatBlockedUntil(Date.now() + retryAfterSeconds * 1000);
    },
    [setChatBlockedUntil],
  );

  const submitMessage = useCallback(
    async ({
      content,
      appendUserMessage,
    }: {
      content: string;
      appendUserMessage: boolean;
    }) => {
      const trimmed = content.trim();

      if (!trimmed || isSubmitting) {
        return false;
      }

      clearError();
      setLastSubmittedMessage(trimmed);
      setSubmitting(true);

      try {
        if (!sessionId) {
          const sessionResponse = await startSessionMutation.mutateAsync({
            is_reset: false,
          });
          hydrateInitialSession(sessionResponse);

          if (appendUserMessage) {
            addUserMessage(trimmed);
          }

          const response = await continueSurveyMutation.mutateAsync({
            session_id: sessionResponse.session_id,
            user_answer: trimmed,
          });

          applyChatResponse(response);
        } else {
          if (appendUserMessage) {
            addUserMessage(trimmed);
          }

          const response = await continueSurveyMutation.mutateAsync({
            session_id: sessionId,
            user_answer: trimmed,
          });

          applyChatResponse(response);
        }

        return true;
      } catch (requestError) {
        applyServerSideChatBlock(requestError);
        setError(extractApiErrorMessage(requestError));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [
      addUserMessage,
      applyServerSideChatBlock,
      applyChatResponse,
      clearError,
      continueSurveyMutation,
      hydrateInitialSession,
      isSubmitting,
      sessionId,
      setError,
      setLastSubmittedMessage,
      setSubmitting,
      startSessionMutation,
    ],
  );

  const handleRetry = useCallback(async () => {
    queueFocusRestore();

    if (!lastSubmittedMessage) {
      await bootstrapSurvey(true);
      return;
    }

    if (isRecoverableMockSessionError(error)) {
      clearError();
      resetSurveyState();
      setHasBootstrapped(true);
      setLastSubmittedMessage(lastSubmittedMessage);
      setSubmitting(true);

      try {
        const sessionResponse = await startSessionMutation.mutateAsync({
          is_reset: true,
        });
        hydrateInitialSession(sessionResponse);
        addUserMessage(lastSubmittedMessage);

        const response = await continueSurveyMutation.mutateAsync({
          session_id: sessionResponse.session_id,
          user_answer: lastSubmittedMessage,
        });

        applyChatResponse(response);
      } catch (requestError) {
        applyServerSideChatBlock(requestError);
        setError(extractApiErrorMessage(requestError));
      } finally {
        setSubmitting(false);
      }

      return;
    }

    await submitMessage({
      content: lastSubmittedMessage,
      appendUserMessage: false,
    });
  }, [
    addUserMessage,
    applyServerSideChatBlock,
    applyChatResponse,
    bootstrapSurvey,
    clearError,
    continueSurveyMutation,
    error,
    hydrateInitialSession,
    lastSubmittedMessage,
    queueFocusRestore,
    resetSurveyState,
    setError,
    setHasBootstrapped,
    setLastSubmittedMessage,
    setSubmitting,
    startSessionMutation,
    submitMessage,
  ]);

  const handleReset = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    clearError();

    if (!sessionId) {
      queueFocusRestore();
      clearModerationState();
      resetSurveyState();
      await bootstrapSurvey();
      return;
    }

    queueFocusRestore();
    setSubmitting(true);

    try {
      const response = await resetSurveyMutation.mutateAsync();

      clearModerationState();
      hydrateInitialSession(response);
    } catch (requestError) {
      const errorMessage = extractApiErrorMessage(requestError);

      if (isRecoverableMockSessionError(errorMessage)) {
        resetSurveyState();
        setHasBootstrapped(false);
        await bootstrapSurvey(true);
        return;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [
    bootstrapSurvey,
    clearError,
    clearModerationState,
    hydrateInitialSession,
    isSubmitting,
    queueFocusRestore,
    resetSurveyMutation,
    resetSurveyState,
    sessionId,
    setError,
    setHasBootstrapped,
    setSubmitting,
  ]);

  const handleBlockedSubmission = useCallback(() => {
    cancelFocusRestore();
  }, [cancelFocusRestore]);

  return {
    submitMessage,
    handleRetry,
    handleReset,
    handleBlockedSubmission,
  };
};
