import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSupportChatStore } from '@/features/support-chat/store/useSupportChatStore';
import type { SupportChatMessage } from '@/features/support-chat/types/supportChat';

const AUTO_SCROLL_NEAR_BOTTOM_THRESHOLD_PX = 72;

type UseSupportChatPanelParams = {
  onRequestClose: () => void;
};

const toMessageUpdateCursor = (
  messages: SupportChatMessage[],
  isSubmitting: boolean,
  showQuickActions: boolean,
) => {
  const latestMessage = messages.at(-1);

  return `${messages.length}:${latestMessage?.id ?? 'none'}:${latestMessage?.content.length ?? 0}:${isSubmitting ? 1 : 0}:${showQuickActions ? 1 : 0}`;
};

function useSupportChatPanel({ onRequestClose }: UseSupportChatPanelParams) {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastHandledMessageCursorRef = useRef<string | null>(null);

  const {
    messages,
    showQuickActions,
    isOpen,
    isSubmitting,
    isPinnedToBottom,
    togglePanel,
    setPinnedToBottom,
  } = useSupportChatStore();

  const messageUpdateCursor = useMemo(
    () => toMessageUpdateCursor(messages, isSubmitting, showQuickActions),
    [isSubmitting, messages, showQuickActions],
  );

  const resetPanelUiState = useCallback(() => {
    setHasUnreadMessages(false);
    setPinnedToBottom(true);
  }, [setPinnedToBottom]);

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
      resetPanelUiState();
    },
    [resetPanelUiState],
  );

  const handleClosePanel = useCallback(() => {
    resetPanelUiState();
    onRequestClose();
  }, [onRequestClose, resetPanelUiState]);

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
        !launcherRef.current?.contains(event.target as Node)
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      scrollViewportToBottom('auto');
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen, scrollViewportToBottom]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    lastHandledMessageCursorRef.current = messageUpdateCursor;
  }, [isOpen, messageUpdateCursor]);

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

    const frameId = window.requestAnimationFrame(() => {
      setHasUnreadMessages(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen, isPinnedToBottom, messageUpdateCursor, scrollViewportToBottom]);

  const showJumpToLatestButton =
    isOpen && hasUnreadMessages && !isPinnedToBottom;
  const liveStatusMessage = showJumpToLatestButton
    ? '새 메시지가 도착했습니다. 새 메시지 확인 버튼을 누르면 최신 메시지로 이동합니다.'
    : isSubmitting
      ? '챗봇이 응답을 작성 중입니다.'
      : null;

  return {
    isOpen,
    isPinnedToBottom,
    panelRef,
    launcherRef,
    viewportRef,
    handleClosePanel,
    handleTogglePanel,
    showJumpToLatestButton,
    liveStatusMessage,
    scrollViewportToBottom,
    resetPanelUiState,
  };
}

export default useSupportChatPanel;
