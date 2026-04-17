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
    <div className="border-b border-[#641312] px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="support-chat-header-badge">
            <Bot size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-[0.02em] text-white sm:text-xl">
              고객센터
            </p>
            <p className="mt-1 truncate text-sm leading-5 whitespace-nowrap text-white/70">
              {routeContext.pageLabel} 화면에서도 바로 문의하실 수 있어요.
            </p>
          </div>
        </div>

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
