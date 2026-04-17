import { Bot } from 'lucide-react';

type SupportChatLauncherButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};

function SupportChatLauncherButton({
  isOpen,
  onClick,
}: SupportChatLauncherButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? '고객센터 챗봇 닫기' : '고객센터 챗봇 열기'}
      className="support-chat-fab group fixed right-4 bottom-4 z-[95] flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none sm:right-6 sm:bottom-6"
    >
      <span className="support-chat-fab-glow" />
      <Bot
        size={24}
        className={`relative z-10 transition-transform ${
          isOpen ? 'scale-95 rotate-6' : 'scale-100'
        }`}
      />
    </button>
  );
}

export default SupportChatLauncherButton;
