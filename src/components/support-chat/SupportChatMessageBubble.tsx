import { Bot } from 'lucide-react';

import type { SupportChatMessage } from '@/features/support-chat/types/supportChat';
import { useAuthStore } from '@/store/useAuthStore';
import defaultProfileImage from '@/assets/프로필 이미지.png';
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
    wrapperClassName: 'justify-end',
    bodyClassName: 'support-chat-bubble-user',
    badgeClassName:
      'border border-white/12 bg-white/6 text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]',
  },
} as const;

function SupportChatMessageBubble({ message }: SupportChatMessageBubbleProps) {
  const meta = roleMeta[message.role];
  const AssistantIcon = roleMeta.assistant.Icon;
  const account = useAuthStore((state) => state.account);
  const isAuthenticatedUser = useAuthStore((state) => state.isAuthenticated);
  const userAvatarUrl = account?.profile_img_url?.trim() || defaultProfileImage;
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
            <AssistantIcon size={18} />
          </div>
        ) : null}

        <div
          className={`min-w-0 rounded-3xl px-4 py-3.5 ${meta.bodyClassName}`}
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
            <img
              src={userAvatarUrl}
              alt={
                isAuthenticatedUser
                  ? '회원 프로필 이미지'
                  : '비회원 프로필 이미지'
              }
              className="h-full w-full rounded-2xl object-cover"
              onError={(event) => {
                if (event.currentTarget.src !== defaultProfileImage) {
                  event.currentTarget.src = defaultProfileImage;
                }
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SupportChatMessageBubble;
