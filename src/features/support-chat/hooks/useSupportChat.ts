import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';

import type { SupportChatPanelProps } from '@/components/support-chat/SupportChatPanel';
import { SUPPORT_CHAT_QUICK_ACTIONS } from '@/features/support-chat/data/faqs';
import { useSupportChatStore } from '@/features/support-chat/store/useSupportChatStore';
import useSupportChatConversation from './useSupportChatConversation';
import useSupportChatPanel from './useSupportChatPanel';
import { getSupportChatRouteContext } from '../utils/routeContext';

type UseSupportChatResult = {
  panelProps: SupportChatPanelProps;
  launcherProps: {
    isOpen: boolean;
    onClick: () => void;
  };
};

export const useSupportChat = (): UseSupportChatResult => {
  const location = useLocation();
  const previousPathnameRef = useRef<string | null>(null);

  const routeContext = useMemo(
    () => getSupportChatRouteContext(location.pathname),
    [location.pathname],
  );

  const { hasBootstrapped, bootstrapConversation, setRouteContext } =
    useSupportChatStore();

  const {
    messages,
    quickActions,
    showQuickActions,
    isSubmitting,
    sessionNotice,
    inputValue,
    setInputValue,
    dismissSessionNotice,
    handleSubmit,
    handleQuickActionSelect,
    resetConversationState,
  } = useSupportChatConversation({ routeContext });

  const handleCloseConversation = useCallback(() => {
    resetConversationState({
      routeContext,
      keepPanelOpen: false,
      preserveBootstrap: false,
    });
  }, [resetConversationState, routeContext]);

  const {
    isOpen,
    isPinnedToBottom,
    panelRef,
    viewportRef,
    handleClosePanel,
    handleTogglePanel,
    showJumpToLatestButton,
    liveStatusMessage,
    scrollViewportToBottom,
    resetPanelUiState,
  } = useSupportChatPanel({
    onRequestClose: handleCloseConversation,
  });

  const handleResetConversation = useCallback(() => {
    resetPanelUiState();
    resetConversationState({
      routeContext,
      keepPanelOpen: true,
      preserveBootstrap: true,
    });
  }, [resetConversationState, resetPanelUiState, routeContext]);

  useEffect(() => {
    if (!hasBootstrapped) {
      bootstrapConversation(routeContext);
      previousPathnameRef.current = routeContext.pathname;
      return;
    }

    if (
      previousPathnameRef.current &&
      previousPathnameRef.current !== routeContext.pathname
    ) {
      previousPathnameRef.current = routeContext.pathname;
      const frameId = window.requestAnimationFrame(() => {
        resetPanelUiState();
        resetConversationState({
          routeContext,
          keepPanelOpen: isOpen,
          preserveBootstrap: true,
        });
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setRouteContext(routeContext);
    previousPathnameRef.current = routeContext.pathname;
  }, [
    bootstrapConversation,
    hasBootstrapped,
    isOpen,
    resetConversationState,
    resetPanelUiState,
    routeContext,
    setRouteContext,
  ]);

  return {
    panelProps: {
      isOpen,
      panelRef,
      viewportRef,
      routeContext,
      messages,
      quickActions: showQuickActions
        ? quickActions
        : SUPPORT_CHAT_QUICK_ACTIONS,
      showQuickActions,
      isSubmitting,
      sessionNotice,
      isPinnedToBottom,
      showJumpToLatestButton,
      liveStatusMessage,
      inputValue,
      onDismissSessionNotice: dismissSessionNotice,
      onReset: handleResetConversation,
      onClose: handleClosePanel,
      onJumpToLatest: () => {
        scrollViewportToBottom('smooth');
      },
      onQuickActionSelect: handleQuickActionSelect,
      onInputChange: setInputValue,
      onSubmit: handleSubmit,
    },
    launcherProps: {
      isOpen,
      onClick: handleTogglePanel,
    },
  };
};
