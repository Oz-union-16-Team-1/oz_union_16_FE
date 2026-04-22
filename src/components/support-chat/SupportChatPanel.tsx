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
  isViewportNearBottom: boolean;
  showJumpToLatestButton: boolean;
  liveStatusMessage: string | null;
  error: string | null;
  inputValue: string;
  onReset: () => void;
  onClose: () => void;
  onJumpToLatest: () => void;
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
  isViewportNearBottom,
  showJumpToLatestButton,
  liveStatusMessage,
  error,
  inputValue,
  onReset,
  onClose,
  onJumpToLatest,
  onQuickActionSelect,
  onInputChange,
  onSubmit,
}: SupportChatPanelProps) {
  return (
    <div
      ref={panelRef}
      className={`support-chat-panel fixed right-4 bottom-24 z-[90] flex h-[min(78vh,46rem)] w-[min(94vw,27rem)] origin-bottom-right flex-col overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none sm:right-6 sm:bottom-26 ${
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
        role="log"
        aria-live={isViewportNearBottom ? 'polite' : 'off'}
        aria-relevant="additions text"
        aria-label="고객센터 챗봇 대화 내역"
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

      {showJumpToLatestButton ? (
        <div className="pointer-events-none absolute right-4 bottom-[5.75rem] z-20 flex justify-end">
          <button
            type="button"
            onClick={onJumpToLatest}
            className="pointer-events-auto inline-flex items-center rounded-full border border-[#cf4a44]/75 bg-[#2a0f0f]/95 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_16px_30px_rgba(0,0,0,0.35)] transition hover:border-[#e05f58] hover:bg-[#371413] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df3b33] motion-reduce:transition-none"
          >
            새 메시지 확인
          </button>
        </div>
      ) : null}

      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveStatusMessage}
      </p>

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
