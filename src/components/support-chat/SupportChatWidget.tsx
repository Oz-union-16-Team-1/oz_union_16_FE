import {
  type MutableRefObject,
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

function SupportChatWidget() {
  const location = useLocation();
  const [inputValue, setInputValue] = useState('');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

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
    isOpen,
    isSubmitting,
    error,
    bootstrapConversation,
    resetConversation,
    closePanel,
    togglePanel,
    setRouteContext,
    setSessionId,
    setSubmitting,
    setError,
    clearError,
    hideQuickActions,
    appendUserMessage,
    beginAssistantMessage,
    appendAssistantChunk,
    finalizeAssistantMessage,
    removeMessage,
  } = useSupportChatStore();

  const sendMessageMutation = useSendChatbotMessageMutation();

  const isRecoverableSessionError = (message: string) =>
    message.includes('session_id') || message.includes('유효하지 않은');

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
        closePanel();
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('.support-chat-fab')
      ) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [closePanel, isOpen]);

  useEffect(
    () => () => {
      streamAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!isOpen || !viewportRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'auto',
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen, isSubmitting, messages, showQuickActions]);

  const handleReset = () => {
    streamAbortRef.current?.abort();
    setInputValue('');
    resetConversation(routeContext);
  };

  const submitMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 2 || isSubmitting) {
      setError('메시지는 공백일 수 없고 2자 이상이어야 합니다.');
      return;
    }

    const assistantPlaceholderMessageId = crypto.randomUUID();

    clearError();
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
        setError(errorMessage);
      }

      setSubmitting(false);
    } finally {
      streamAbortRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      setError('메시지는 공백일 수 없고 2자 이상이어야 합니다.');
      return;
    }

    const nextValue = inputValue;
    setInputValue('');
    await submitMessage(nextValue);
  };

  const handleQuickActionSelect = async (label: string) => {
    await submitMessage(label);
  };

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
        error={error}
        inputValue={inputValue}
        onReset={handleReset}
        onClose={closePanel}
        onQuickActionSelect={handleQuickActionSelect}
        onInputChange={(value) => {
          if (error) {
            clearError();
          }

          setInputValue(value);
        }}
        onSubmit={handleSubmit}
      />
      <SupportChatLauncherButton isOpen={isOpen} onClick={togglePanel} />
    </>
  );
}

export default SupportChatWidget;
