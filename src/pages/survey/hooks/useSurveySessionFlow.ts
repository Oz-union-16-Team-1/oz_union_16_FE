import { useCallback, useEffect } from 'react';

import { isMockServiceWorkerEnabled } from '../../../lib/env';
import {
  useContinueSurveyMutation,
  useResetSurveyMutation,
  useStartSurveySessionMutation,
} from '../../../features/survey/api/useSurveyApi';
import {
  extractApiErrorMessage,
  extractApiRetryAfterSeconds,
} from '../../../features/survey/api/survey';
import { useSurveyStore } from '../../../features/survey/store/useSurveyStore';

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
  const setPendingAction = useSurveyStore((state) => state.setPendingAction);
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

  const requestSessionStart = useCallback(async () => {
    const response = await startSessionMutation.mutateAsync();
    hydrateInitialSession(response);

    return response;
  }, [hydrateInitialSession, startSessionMutation]);

  const requestSessionReset = useCallback(async () => {
    const response = await resetSurveyMutation.mutateAsync();
    hydrateInitialSession(response);

    return response;
  }, [hydrateInitialSession, resetSurveyMutation]);

  const requestSurveyMessage = useCallback(
    async (activeSessionId: string, content: string) => {
      const response = await continueSurveyMutation.mutateAsync({
        session_id: activeSessionId,
        user_answer: content,
      });

      applyChatResponse(response);

      return response;
    },
    [applyChatResponse, continueSurveyMutation],
  );

  const bootstrapSurvey = useCallback(
    async (force = false) => {
      if ((hasBootstrapped && !force) || (isSubmitting && !force)) {
        return;
      }

      clearError();
      resetSurveyState();
      setPendingAction('start');
      setHasBootstrapped(true);
      setSubmitting(true);

      try {
        await requestSessionStart();
      } catch (requestError) {
        setError(extractApiErrorMessage(requestError, 'start'));
      } finally {
        setPendingAction(null);
        setSubmitting(false);
      }
    },
    [
      clearError,
      hasBootstrapped,
      isSubmitting,
      requestSessionStart,
      resetSurveyState,
      setError,
      setHasBootstrapped,
      setPendingAction,
      setSubmitting,
    ],
  );

  useEffect(() => {
    if (!sessionId && !hasBootstrapped && !error) {
      void bootstrapSurvey();
    }
  }, [bootstrapSurvey, error, hasBootstrapped, sessionId]);

  const ensureSessionId = useCallback(async () => {
    if (sessionId) {
      return sessionId;
    }

    const sessionResponse = await requestSessionStart();

    return sessionResponse.session_id;
  }, [requestSessionStart, sessionId]);

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
      setPendingAction('continue');
      setSubmitting(true);

      try {
        const activeSessionId = await ensureSessionId();

        if (appendUserMessage) {
          addUserMessage(trimmed);
        }

        await requestSurveyMessage(activeSessionId, trimmed);

        return true;
      } catch (requestError) {
        applyServerSideChatBlock(requestError);
        setError(extractApiErrorMessage(requestError, 'continue'));
        return false;
      } finally {
        setPendingAction(null);
        setSubmitting(false);
      }
    },
    [
      addUserMessage,
      applyServerSideChatBlock,
      clearError,
      ensureSessionId,
      isSubmitting,
      requestSurveyMessage,
      setError,
      setLastSubmittedMessage,
      setPendingAction,
      setSubmitting,
    ],
  );

  const retryWithFreshSession = useCallback(
    async (content: string) => {
      clearError();
      resetSurveyState();
      setPendingAction('continue');
      setHasBootstrapped(true);
      setLastSubmittedMessage(content);
      setSubmitting(true);

      try {
        const sessionResponse = await requestSessionReset();
        addUserMessage(content);
        await requestSurveyMessage(sessionResponse.session_id, content);
      } catch (requestError) {
        applyServerSideChatBlock(requestError);
        setError(extractApiErrorMessage(requestError, 'continue'));
      } finally {
        setPendingAction(null);
        setSubmitting(false);
      }
    },
    [
      addUserMessage,
      applyServerSideChatBlock,
      clearError,
      requestSessionReset,
      requestSurveyMessage,
      resetSurveyState,
      setError,
      setHasBootstrapped,
      setLastSubmittedMessage,
      setPendingAction,
      setSubmitting,
    ],
  );

  const handleRetry = useCallback(async () => {
    queueFocusRestore();

    if (!lastSubmittedMessage) {
      await bootstrapSurvey(true);
      return;
    }

    if (isRecoverableMockSessionError(error)) {
      await retryWithFreshSession(lastSubmittedMessage);
      return;
    }

    await submitMessage({
      content: lastSubmittedMessage,
      appendUserMessage: false,
    });
  }, [
    bootstrapSurvey,
    error,
    lastSubmittedMessage,
    queueFocusRestore,
    retryWithFreshSession,
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
    setPendingAction('reset');
    setSubmitting(true);

    try {
      clearModerationState();
      await requestSessionReset();
    } catch (requestError) {
      const errorMessage = extractApiErrorMessage(requestError, 'reset');

      if (isRecoverableMockSessionError(errorMessage)) {
        resetSurveyState();
        setHasBootstrapped(false);
        await bootstrapSurvey(true);
        return;
      }

      setError(errorMessage);
    } finally {
      setPendingAction(null);
      setSubmitting(false);
    }
  }, [
    bootstrapSurvey,
    clearError,
    clearModerationState,
    isSubmitting,
    queueFocusRestore,
    requestSessionReset,
    resetSurveyState,
    sessionId,
    setError,
    setHasBootstrapped,
    setPendingAction,
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
