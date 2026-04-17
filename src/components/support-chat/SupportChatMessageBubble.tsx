import { Bot, UserRound } from 'lucide-react';

import type { SupportChatMessage } from '@/features/support-chat/types/supportChat';
import SupportChatTypingIndicator from './SupportChatTypingIndicator';

type SupportChatMessageBubbleProps = {
  message: SupportChatMessage;
};

const roleMeta = {
  assistant: {
    Icon: Bot,
    wrapperClassName: 'justify-start',
    bodyClassName: 'support-chat-bubble-bot',
    badgeClassName:
      'border border-[#7a1715]/70 bg-[#2a0e0d] text-[#ff6b62] shadow-[0_0_24px_rgba(201,41,35,0.16)]',
  },
  user: {
    Icon: UserRound,
    wrapperClassName: 'justify-end',
    bodyClassName: 'support-chat-bubble-user',
    badgeClassName:
      'border border-white/12 bg-white/6 text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]',
  },
} as const;

function SupportChatMessageBubble({ message }: SupportChatMessageBubbleProps) {
  const meta = roleMeta[message.role];
  const Icon = meta.Icon;
  const isTyping =
    message.role === 'assistant' &&
    message.status === 'streaming' &&
    !message.content;

  return (
    <div className={`flex w-full ${meta.wrapperClassName}`}>
      <div className="flex max-w-[88%] items-start gap-3 motion-safe:animate-[support-chat-message-in_220ms_ease-out]">
        {message.role === 'assistant' ? (
          <div
            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.badgeClassName}`}
          >
            <Icon size={18} />
          </div>
        ) : null}

        <div
          className={`min-w-0 rounded-[24px] px-4 py-3.5 ${meta.bodyClassName}`}
        >
          {isTyping ? (
            <SupportChatTypingIndicator />
          ) : (
            <p className="text-sm/6 whitespace-pre-line text-white/92">
              {message.content}
            </p>
          )}
        </div>

        {message.role === 'user' ? (
          <div
            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.badgeClassName}`}
          >
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SupportChatMessageBubble;
