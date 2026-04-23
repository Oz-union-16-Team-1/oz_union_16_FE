import { Bot, RotateCcw, X } from 'lucide-react';

import type { SupportChatRouteContext } from '@/features/support-chat/types/supportChat';

type SupportChatHeaderProps = {
  routeContext: SupportChatRouteContext;
  onReset: () => void;
  onClose: () => void;
};

function SupportChatHeader({
  routeContext,
  onReset,
  onClose,
}: SupportChatHeaderProps) {
  return (
    <div
      className="border-b border-[#641312] px-4 py-3.5 sm:px-5"
      data-route-context={routeContext.pageLabel}
    >
      <div className="relative flex items-center justify-between gap-3">
        <div className="support-chat-header-badge">
          <Bot size={20} />
        </div>

        <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[1.35rem] leading-none font-semibold tracking-[0.01em] text-white sm:text-[1.45rem]">
          고객센터 챗봇
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            className="support-chat-icon-btn"
            aria-label="대화 초기화"
            title="대화 초기화"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="support-chat-icon-btn"
            aria-label="챗봇 닫기"
            title="챗봇 닫기"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupportChatHeader;
