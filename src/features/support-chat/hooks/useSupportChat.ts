import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import type { SupportChatPanelProps } from '@/components/support-chat/SupportChatPanel';
import { SUPPORT_CHAT_QUICK_ACTIONS } from '@/features/support-chat/data/faqs';
import { useSupportChatStore } from '@/features/support-chat/store/useSupportChatStore';
import useSupportChatConversation from './useSupportChatConversation';
import useSupportChatPanelState from './useSupportChatPanelState';
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
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const routeContext = useMemo(
    () => getSupportChatRouteContext(location.pathname),
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

  useEffect(() => {
    if (!hasBootstrapped) {
      bootstrapConversation(routeContext);
      return;
    }

    setRouteContext(routeContext);
  }, [bootstrapConversation, hasBootstrapped, routeContext, setRouteContext]);

  const {
    inputValue,
    setInputValue,
    handleSubmit,
    handleQuickActionSelect,
    handleReset,
    abortStreamingResponse,
  } = useSupportChatConversation({
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
  });

  const {
    panelRef,
    viewportRef,
    handleClosePanel,
    handleTogglePanel,
    showJumpToLatestButton,
    liveStatusMessage,
    scrollViewportToBottom,
  } = useSupportChatPanelState({
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
  });

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
      isPinnedToBottom,
      showJumpToLatestButton,
      liveStatusMessage,
      inputValue,
      onReset: handleReset,
      onClose: handleClosePanel,
      onJumpToLatest: () => {
        scrollViewportToBottom('smooth');
      },
      onQuickActionSelect: handleQuickActionSelect,
      onInputChange: (value) => setInputValue(value),
      onSubmit: handleSubmit,
    },
    launcherProps: {
      isOpen,
      onClick: handleTogglePanel,
    },
  };
};
