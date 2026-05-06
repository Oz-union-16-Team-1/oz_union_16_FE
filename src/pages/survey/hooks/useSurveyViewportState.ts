import { useCallback, useEffect, useRef, useState } from 'react';

type UseSurveyViewportStateOptions = {
  messagesLength: number;
  error: string | null;
  hasBootstrapped: boolean;
  sessionId: string | null;
  recommendationReady: boolean;
  isSubmitting: boolean;
  isChatTemporarilyBlocked: boolean;
  hasExpiredChatBlock: boolean;
};

export const useSurveyViewportState = ({
  messagesLength,
  error,
  hasBootstrapped,
  sessionId,
  recommendationReady,
  isSubmitting,
  isChatTemporarilyBlocked,
  hasExpiredChatBlock,
}: UseSurveyViewportStateOptions) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const [enteredWithCompletedSurvey, setEnteredWithCompletedSurvey] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    if (enteredWithCompletedSurvey !== null) {
      return undefined;
    }

    if (
      !hasBootstrapped &&
      !sessionId &&
      messagesLength === 0 &&
      !recommendationReady
    ) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      setEnteredWithCompletedSurvey(
        (current) => current ?? (recommendationReady && messagesLength > 0),
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    enteredWithCompletedSurvey,
    hasBootstrapped,
    messagesLength,
    recommendationReady,
    sessionId,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const shouldJumpToBottom =
      lastMessageCountRef.current === 0 && messagesLength > 0;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: shouldJumpToBottom ? 'auto' : 'smooth',
    });

    lastMessageCountRef.current = messagesLength;
  }, [error, messagesLength]);

  const restoreTextareaFocus = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea || textarea.disabled) {
        return;
      }

      textarea.focus();
      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }, []);

  useEffect(() => {
    if (
      !isSubmitting &&
      !recommendationReady &&
      !isChatTemporarilyBlocked &&
      !hasExpiredChatBlock &&
      shouldRestoreFocusRef.current
    ) {
      shouldRestoreFocusRef.current = false;
      restoreTextareaFocus();
    }
  }, [
    hasExpiredChatBlock,
    isChatTemporarilyBlocked,
    isSubmitting,
    recommendationReady,
    restoreTextareaFocus,
  ]);

  const queueFocusRestore = useCallback(() => {
    shouldRestoreFocusRef.current = true;
  }, []);

  const cancelFocusRestore = useCallback(() => {
    shouldRestoreFocusRef.current = false;
  }, []);

  return {
    viewportRef,
    formRef,
    textareaRef,
    enteredWithCompletedSurvey: enteredWithCompletedSurvey ?? false,
    queueFocusRestore,
    cancelFocusRestore,
  };
};
