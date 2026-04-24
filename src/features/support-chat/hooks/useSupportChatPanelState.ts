import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

const AUTO_SCROLL_NEAR_BOTTOM_THRESHOLD_PX = 72;

type UseSupportChatPanelStateParams = {
  isOpen: boolean;
  isSubmitting: boolean;
  isPinnedToBottom: boolean;
  showQuickActions: boolean;
  messages: Array<{
    id: string;
    content: string;
  }>;
  closePanel: () => void;
  togglePanel: () => void;
  setPinnedToBottom: (isPinnedToBottom: boolean) => void;
  hasUnreadMessages: boolean;
  setHasUnreadMessages: Dispatch<SetStateAction<boolean>>;
  abortStreamingResponse: (resetSubmitting?: boolean) => void;
};

function useSupportChatPanelState({
  isOpen,
  isSubmitting,
  isPinnedToBottom,
  showQuickActions,
  messages,
  closePanel,
  togglePanel,
  setPinnedToBottom,
  hasUnreadMessages,
  setHasUnreadMessages,
  abortStreamingResponse,
}: UseSupportChatPanelStateParams) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastHandledMessageCursorRef = useRef<string | null>(null);

  const messageUpdateCursor = useMemo(() => {
    const latestMessage = messages.at(-1);

    return `${messages.length}:${latestMessage?.id ?? 'none'}:${latestMessage?.content.length ?? 0}:${isSubmitting ? 1 : 0}:${showQuickActions ? 1 : 0}`;
  }, [isSubmitting, messages, showQuickActions]);

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
    [setHasUnreadMessages, setPinnedToBottom],
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
      abortStreamingResponse(true);
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
    setHasUnreadMessages,
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
  }, [isNearBottom, isOpen, setHasUnreadMessages, setPinnedToBottom]);

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
  }, [
    isOpen,
    isPinnedToBottom,
    messageUpdateCursor,
    scrollViewportToBottom,
    setHasUnreadMessages,
  ]);

  const showJumpToLatestButton =
    isOpen && hasUnreadMessages && !isPinnedToBottom;
  const liveStatusMessage = showJumpToLatestButton
    ? '새 메시지가 도착했습니다. 새 메시지 확인 버튼을 누르면 최신 메시지로 이동합니다.'
    : isSubmitting
      ? '챗봇이 응답을 작성 중입니다.'
      : null;

  return {
    panelRef: panelRef as MutableRefObject<HTMLDivElement | null>,
    viewportRef: viewportRef as MutableRefObject<HTMLDivElement | null>,
    handleClosePanel,
    handleTogglePanel,
    showJumpToLatestButton,
    liveStatusMessage,
    scrollViewportToBottom,
  };
}

export default useSupportChatPanelState;
