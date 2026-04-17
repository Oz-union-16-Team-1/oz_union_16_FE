import type { RefObject } from 'react';

import type {
  SupportChatMessage,
  SupportChatQuickAction,
  SupportChatRouteContext,
} from '@/features/support-chat/types/supportChat';
import SupportChatComposer from './SupportChatComposer';
import SupportChatHeader from './SupportChatHeader';
import SupportChatMessageBubble from './SupportChatMessageBubble';
import SupportChatQuickActions from './SupportChatQuickActions';

type SupportChatPanelProps = {
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  routeContext: SupportChatRouteContext;
  messages: SupportChatMessage[];
  quickActions: SupportChatQuickAction[];
  showQuickActions: boolean;
  isSubmitting: boolean;
  error: string | null;
  inputValue: string;
  onReset: () => void;
  onClose: () => void;
  onQuickActionSelect: (label: string) => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
};

function SupportChatPanel({
  isOpen,
  panelRef,
  viewportRef,
  routeContext,
  messages,
  quickActions,
  showQuickActions,
  isSubmitting,
  error,
  inputValue,
  onReset,
  onClose,
  onQuickActionSelect,
  onInputChange,
  onSubmit,
}: SupportChatPanelProps) {
  return (
    <div
      ref={panelRef}
      className={`support-chat-panel fixed right-4 bottom-24 z-[90] flex h-[min(78vh,46rem)] w-[min(94vw,27rem)] origin-bottom-right flex-col overflow-hidden transition-all duration-300 ease-out sm:right-6 sm:bottom-26 ${
        isOpen
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-4 scale-95 opacity-0'
      }`}
      role="dialog"
      aria-modal="false"
      aria-label="고객센터 챗봇"
    >
      <SupportChatHeader
        routeContext={routeContext}
        onReset={onReset}
        onClose={onClose}
      />

      <div
        ref={viewportRef}
        className="support-chat-scrollbar flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <SupportChatMessageBubble key={message.id} message={message} />
          ))}

          {showQuickActions ? (
            <SupportChatQuickActions
              actions={quickActions}
              disabled={isSubmitting}
              onSelect={onQuickActionSelect}
            />
          ) : null}
        </div>
      </div>

      <SupportChatComposer
        value={inputValue}
        disabled={isSubmitting}
        error={error}
        onChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

export default SupportChatPanel;
