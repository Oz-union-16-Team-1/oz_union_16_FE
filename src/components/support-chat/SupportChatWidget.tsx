import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router';

import {
  createDefaultRouteContext,
  SUPPORT_CHAT_QUICK_ACTIONS,
} from '@/features/support-chat/data/faqs';
import {
  extractSupportChatErrorMessage,
  streamChatbotResponse,
} from '@/features/support-chat/api/chatbot';
import { useSendChatbotMessageMutation } from '@/features/support-chat/api/useSupportChatApi';
import { useSupportChatStore } from '@/features/support-chat/store/useSupportChatStore';
import type { SupportChatRouteContext } from '@/features/support-chat/types/supportChat';
import SupportChatLauncherButton from './SupportChatLauncherButton';
import SupportChatPanel from './SupportChatPanel';

const getPageLabel = (pathname: string) => {
  if (pathname === '/login') {
    return '로그인';
  }

  if (pathname === '/join' || pathname === '/signup') {
    return '회원가입';
  }

  if (pathname === '/callback' || pathname === '/auth/callback') {
    return '로그인';
  }

  if (pathname === '/my-page') {
    return '마이페이지';
  }

  if (pathname.startsWith('/survey')) {
    return '설문';
  }

  if (pathname.startsWith('/matching-list')) {
    return '매칭';
  }

  if (pathname.startsWith('/recommendation-list')) {
    return '추천';
  }

  return '현재';
};

const getRouteContext = (pathname: string): SupportChatRouteContext => ({
  pathname,
  pageLabel: getPageLabel(pathname),
});

const AUTO_SCROLL_NEAR_BOTTOM_THRESHOLD_PX = 72;
const SUPPORT_CHAT_INPUT_VALIDATION_MESSAGE =
  '메시지는 공백일 수 없고 2자 이상이어야 합니다.';

function SupportChatWidget() {
  const location = useLocation();
  const [inputValue, setInputValue] = useState('');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const lastHandledMessageCursorRef = useRef<string | null>(null);

  const routeContext = useMemo(
    () => getRouteContext(location.pathname),
    [location.pathname],
  );

  const {
    sessionId,
    messages,
    quickActions,
    showQuickActions,
    hasBootstrapped,
    isPinnedToBottom,
    isOpen,
    isSubmitting,
    bootstrapConversation,
    resetConversation,
    closePanel,
    togglePanel,
    setRouteContext,
    setSessionId,
    setPinnedToBottom,
    setSubmitting,
    hideQuickActions,
    appendUserMessage,
    appendAssistantMessage,
    beginAssistantMessage,
    appendAssistantChunk,
    finalizeAssistantMessage,
    removeMessage,
  } = useSupportChatStore();
  const messageUpdateCursor = useMemo(() => {
    const latestMessage = messages.at(-1);

    return `${messages.length}:${latestMessage?.id ?? 'none'}:${latestMessage?.content.length ?? 0}:${isSubmitting ? 1 : 0}:${showQuickActions ? 1 : 0}`;
  }, [isSubmitting, messages, showQuickActions]);

  const sendMessageMutation = useSendChatbotMessageMutation();

  const isRecoverableSessionError = (message: string) =>
    message.includes('session_id') || message.includes('유효하지 않은');

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

  const isNearBottom = useCallback((viewport: HTMLDivElement) => {
    const distanceFromBottom =
      viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;

    return distanceFromBottom <= AUTO_SCROLL_NEAR_BOTTOM_THRESHOLD_PX;
  }, []);

  const scrollViewportToBottom = useCallback(
    (behavior: ScrollBehavior) => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
      setPinnedToBottom(true);
      setHasUnreadMessages(false);
    },
    [setPinnedToBottom],
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

  const handleClosePanel = useCallback(() => {
    abortStreamingResponse(true);
    closePanel();
  }, [abortStreamingResponse, closePanel]);

  const handleTogglePanel = useCallback(() => {
    if (isOpen) {
      handleClosePanel();
      return;
    }

    togglePanel();
  }, [handleClosePanel, isOpen, togglePanel]);

  useEffect(() => {
    if (!hasBootstrapped) {
      bootstrapConversation(routeContext);
      return;
    }

    setRouteContext(routeContext);
  }, [bootstrapConversation, hasBootstrapped, routeContext, setRouteContext]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClosePanel();
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('.support-chat-fab')
      ) {
        handleClosePanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleClosePanel, isOpen]);

  useEffect(
    () => () => {
      abortStreamingResponse(true);
    },
    [abortStreamingResponse],
  );

  useEffect(() => {
    if (!isOpen) {
      if (streamAbortRef.current) {
        abortStreamingResponse(true);
      }

      setHasUnreadMessages(false);
      setPinnedToBottom(true);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      scrollViewportToBottom('auto');
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    abortStreamingResponse,
    isOpen,
    scrollViewportToBottom,
    setPinnedToBottom,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const handleViewportScroll = () => {
      const nearBottom = isNearBottom(viewport);
      setPinnedToBottom(nearBottom);

      if (nearBottom) {
        setHasUnreadMessages(false);
      }
    };

    handleViewportScroll();
    viewport.addEventListener('scroll', handleViewportScroll, {
      passive: true,
    });

    return () => {
      viewport.removeEventListener('scroll', handleViewportScroll);
    };
  }, [isNearBottom, isOpen, setPinnedToBottom]);

  useEffect(() => {
    if (!isOpen) {
      lastHandledMessageCursorRef.current = messageUpdateCursor;
      return;
    }

    const hasNewIncomingUpdate =
      lastHandledMessageCursorRef.current !== messageUpdateCursor;
    lastHandledMessageCursorRef.current = messageUpdateCursor;

    if (!hasNewIncomingUpdate) {
      return;
    }

    if (isPinnedToBottom) {
      const frameId = window.requestAnimationFrame(() => {
        scrollViewportToBottom('auto');
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setHasUnreadMessages(true);
  }, [isOpen, isPinnedToBottom, messageUpdateCursor, scrollViewportToBottom]);

  const handleReset = () => {
    abortStreamingResponse(true);
    setInputValue('');
    setHasUnreadMessages(false);
    setPinnedToBottom(true);
    resetConversation(routeContext);
  };

  const submitMessage = async (message: string) => {
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
            appendAssistantChunk(assistantPlaceholderMessageId, event.content);
          }

          if (event.type === 'complete') {
            finalizeAssistantMessage(assistantPlaceholderMessageId);
            setSubmitting(false);
          }
        },
      });
    } catch (requestError) {
      // 스트림 실패 시에는 사용자 메시지는 보존하고,
      // 임시 assistant 메시지만 제거한 뒤 오류 메시지를 안내한다.
      removeMessage(assistantPlaceholderMessageId);
      const errorMessage = extractSupportChatErrorMessage(requestError);

      if (errorMessage) {
        appendAssistantErrorMessage(errorMessage);
      }

      setSubmitting(false);
    } finally {
      streamAbortRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      appendAssistantErrorMessage(SUPPORT_CHAT_INPUT_VALIDATION_MESSAGE);
      return;
    }

    const nextValue = inputValue;
    setInputValue('');
    await submitMessage(nextValue);
  };

  const handleQuickActionSelect = async (label: string) => {
    await submitMessage(label);
  };

  const showJumpToLatestButton =
    isOpen && hasUnreadMessages && !isPinnedToBottom;
  const liveStatusMessage = showJumpToLatestButton
    ? '새 메시지가 도착했습니다. 새 메시지 확인 버튼을 누르면 최신 메시지로 이동합니다.'
    : isSubmitting
      ? '챗봇이 응답을 작성 중입니다.'
      : null;

  return (
    <>
      <SupportChatPanel
        isOpen={isOpen}
        panelRef={panelRef as MutableRefObject<HTMLDivElement | null>}
        viewportRef={viewportRef as MutableRefObject<HTMLDivElement | null>}
        routeContext={routeContext || createDefaultRouteContext()}
        messages={messages}
        quickActions={
          showQuickActions ? quickActions : SUPPORT_CHAT_QUICK_ACTIONS
        }
        showQuickActions={showQuickActions}
        isSubmitting={isSubmitting}
        isPinnedToBottom={isPinnedToBottom}
        showJumpToLatestButton={showJumpToLatestButton}
        liveStatusMessage={liveStatusMessage}
        inputValue={inputValue}
        onReset={handleReset}
        onClose={handleClosePanel}
        onJumpToLatest={() => {
          scrollViewportToBottom('smooth');
        }}
        onQuickActionSelect={handleQuickActionSelect}
        onInputChange={(value) => {
          setInputValue(value);
        }}
        onSubmit={handleSubmit}
      />
      <SupportChatLauncherButton isOpen={isOpen} onClick={handleTogglePanel} />
    </>
  );
}

export default SupportChatWidget;
