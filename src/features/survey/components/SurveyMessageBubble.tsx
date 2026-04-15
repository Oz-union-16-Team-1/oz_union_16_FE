import { Bot, UserRound } from 'lucide-react';

import type { SurveyMessage } from '../types/survey';

interface SurveyMessageBubbleProps {
  message: SurveyMessage;
}

const roleMeta = {
  assistant: {
    label: 'AI 질문',
    icon: Bot,
    wrapperClassName: 'justify-start',
    contentClassName: 'flex-row',
    textClassName: 'text-left',
    bubbleClassName:
      'bg-white/[0.04] text-white border border-white/8 rounded-[24px] rounded-tl-md shadow-[0_18px_40px_rgba(0,0,0,0.28)]',
    iconClassName: 'bg-white/[0.05] text-[#ff4d4d]',
  },
  user: {
    label: '내 답변',
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

  return (
    <div className={`flex w-full ${meta.wrapperClassName}`}>
      <div
        className={`flex max-w-[92%] items-start gap-3 md:max-w-[74%] ${meta.contentClassName}`}
      >
        <div
          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.iconClassName}`}
        >
          <Icon size={18} />
        </div>
        <div
          className={`px-4 py-4 md:px-5 ${meta.bubbleClassName} ${meta.textClassName}`}
        >
          <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-white/45 uppercase">
            {meta.label}
          </p>
          <p className="text-[15px] leading-7 whitespace-pre-line text-white/92">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SurveyMessageBubble;
