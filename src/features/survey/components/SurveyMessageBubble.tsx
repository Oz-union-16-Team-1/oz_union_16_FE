import { Bot, UserRound } from 'lucide-react';

import defaultProfileImage from '../../../assets/프로필 이미지.png';
import { useAuthStore } from '../../../store/useAuthStore';
import type { SurveyMessage } from '../types/survey';

interface SurveyMessageBubbleProps {
  message: SurveyMessage;
}

const roleMeta = {
  assistant: {
    icon: Bot,
    wrapperClassName: 'justify-start',
    contentClassName: 'flex-row',
    textClassName: 'text-left',
    bubbleClassName:
      'bg-white/4 text-white border border-white/8 rounded-[24px] rounded-tl-md shadow-[0_18px_40px_rgba(0,0,0,0.28)]',
    iconClassName: 'bg-white/5 text-[#ff4d4d]',
  },
  user: {
    icon: UserRound,
    wrapperClassName: 'justify-end',
    contentClassName: 'flex-row-reverse',
    textClassName: 'text-right',
    bubbleClassName:
      'bg-[linear-gradient(135deg,rgba(145,14,14,0.88),rgba(84,5,5,0.95))] text-white border border-[#6f1818] rounded-[24px] rounded-tr-md shadow-[0_18px_40px_rgba(130,0,0,0.25)]',
    iconClassName: 'bg-[#1b0b0b] text-[#ffb0b0]',
  },
} as const;

function SurveyMessageBubble({ message }: SurveyMessageBubbleProps) {
  const meta = roleMeta[message.role];
  const Icon = meta.icon;
  const account = useAuthStore((state) => state.account);
  const isAuthenticatedUser = useAuthStore((state) => state.isAuthenticated);
  const userAvatarUrl = account?.profile_img_url?.trim() || defaultProfileImage;
  const normalizedContent = message.content.trim();
  const isCompactMessage =
    !normalizedContent.includes('\n') && normalizedContent.length <= 36;
  const bubbleSpacingClassName = isCompactMessage ? 'gap-2.5' : 'gap-[0.7rem]';
  const avatarSizeClassName = isCompactMessage
    ? 'h-9 w-9'
    : 'h-[38px] w-[38px]';
  const bubblePaddingClassName = isCompactMessage
    ? 'px-4 py-3'
    : 'px-4 py-3.5 md:px-[1.125rem]';
  const bubbleTextClassName = isCompactMessage
    ? 'text-[15px] leading-6'
    : 'text-[15px] leading-[1.6rem]';

  return (
    <div className={`flex w-full ${meta.wrapperClassName}`}>
      <div
        className={`flex max-w-[92%] items-start ${bubbleSpacingClassName} md:max-w-[78%] ${meta.contentClassName}`}
      >
        <div
          className={`mt-1 flex shrink-0 items-center justify-center rounded-2xl ${avatarSizeClassName} ${meta.iconClassName}`}
        >
          {message.role === 'user' ? (
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
          ) : (
            <Icon size={18} />
          )}
        </div>
        <div
          className={`${bubblePaddingClassName} ${meta.bubbleClassName} ${meta.textClassName}`}
        >
          <p
            className={`whitespace-pre-line text-white/92 ${bubbleTextClassName}`}
          >
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SurveyMessageBubble;
