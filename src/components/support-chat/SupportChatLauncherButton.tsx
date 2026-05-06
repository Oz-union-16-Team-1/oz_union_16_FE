import { Bot } from 'lucide-react';
import type { RefObject } from 'react';

type SupportChatLauncherButtonProps = {
  isOpen: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
};

function SupportChatLauncherButton({
  isOpen,
  buttonRef,
  onClick,
}: SupportChatLauncherButtonProps) {
  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      aria-label={isOpen ? '고객센터 챗봇 닫기' : '고객센터 챗봇 열기'}
      aria-controls={isOpen ? 'support-chat-panel' : undefined}
      aria-expanded={isOpen}
      className="support-chat-fab group fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-95 flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:right-6 sm:bottom-6"
    >
      <span className="support-chat-fab-glow" />
      <Bot
        size={24}
        className={`relative z-10 transition-transform motion-reduce:transition-none ${
          isOpen ? 'scale-95 rotate-6' : 'scale-100'
        }`}
      />
    </button>
  );
}

export default SupportChatLauncherButton;
