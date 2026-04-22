import type { FormEvent, KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';

type SupportChatComposerProps = {
  value: string;
  disabled?: boolean;
  error?: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

function SupportChatComposer({
  value,
  disabled = false,
  error = null,
  onChange,
  onSubmit,
}: SupportChatComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="border-t border-white/8 px-4 pt-3 pb-3">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <label className="sr-only" htmlFor="support-chat-message">
          고객센터 챗봇 메시지 입력
        </label>
        <input
          id="support-chat-message"
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          className="support-chat-input min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={disabled}
          className="support-chat-send-btn flex h-13 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>전송</span>
          <SendHorizontal size={16} />
        </button>
      </form>
      {error ? (
        <p
          className="mt-1 text-xs text-[#ff8b84]"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default SupportChatComposer;
