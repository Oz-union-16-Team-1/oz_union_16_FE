import { X } from 'lucide-react';

import type { RefObject } from 'react';

import StatusMessage from '@/components/common/StatusMessage';
import type {
  SupportChatMessage,
  SupportChatQuickAction,
  SupportChatRouteContext,
} from '@/features/support-chat/types/supportChat';
import SupportChatComposer from './SupportChatComposer';
import SupportChatHeader from './SupportChatHeader';
import SupportChatMessageBubble from './SupportChatMessageBubble';
import SupportChatQuickActions from './SupportChatQuickActions';

export type SupportChatPanelProps = {
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  routeContext: SupportChatRouteContext;
  messages: SupportChatMessage[];
  quickActions: SupportChatQuickAction[];
  showQuickActions: boolean;
  isSubmitting: boolean;
  sessionNotice: string | null;
  isPinnedToBottom: boolean;
  showJumpToLatestButton: boolean;
  liveStatusMessage: string | null;
  inputValue: string;
  onDismissSessionNotice: () => void;
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
  sessionNotice,
  isPinnedToBottom,
  showJumpToLatestButton,
  liveStatusMessage,
  inputValue,
  onDismissSessionNotice,
  onReset,
  onClose,
  onJumpToLatest,
  onQuickActionSelect,
  onInputChange,
  onSubmit,
}: SupportChatPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      id="support-chat-panel"
      ref={panelRef}
      className="support-chat-panel support-chat-widget-panel pointer-events-auto fixed right-4 bottom-24 z-90 flex h-[min(78vh,46rem)] w-[min(94vw,27rem)] origin-bottom-right translate-y-0 scale-100 flex-col overflow-hidden opacity-100 transition-all duration-300 ease-out motion-reduce:transition-none sm:right-6 sm:bottom-26"
      role="dialog"
      aria-modal="false"
      aria-label="고객센터 챗봇"
    >
      <SupportChatHeader
        routeContext={routeContext}
        onReset={onReset}
        onClose={onClose}
      />

      {sessionNotice ? (
        <div className="border-b border-[#6d201f] bg-[#2a0f0f]/88 px-4 py-3 sm:px-5">
          <div className="flex items-start gap-3">
            <StatusMessage
              tone="error"
              variant="surface"
              className="flex-1 border-[#cf4a44]/35 bg-[#411817]/70 px-3.5 py-2.5 text-[13px]/5 text-white"
            >
              {sessionNotice}
            </StatusMessage>
            <button
              type="button"
              onClick={onDismissSessionNotice}
              className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/72 transition hover:border-white/18 hover:bg-white/8 hover:text-white"
              aria-label="세션 만료 안내 닫기"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className="support-chat-scrollbar flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live={isPinnedToBottom ? 'polite' : 'off'}
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
        <div className="pointer-events-none absolute right-4 bottom-23 z-20 flex justify-end">
          <button
            type="button"
            onClick={onJumpToLatest}
            className="focus-visible:outline-support-chat-accent pointer-events-auto inline-flex items-center rounded-full border border-[#cf4a44]/75 bg-[#2a0f0f]/95 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_16px_30px_rgba(0,0,0,0.35)] transition hover:border-[#e05f58] hover:bg-[#371413] focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
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
        onChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

export default SupportChatPanel;
