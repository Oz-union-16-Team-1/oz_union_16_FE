import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type ToastMessageTone = 'success' | 'error';

type ToastMessageProps = {
  message: string;
  tone?: ToastMessageTone;
  onClose: () => void;
};

function ToastMessage({
  message,
  tone = 'success',
  onClose,
}: ToastMessageProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className="bg-mypage-panel border-mypage-panel shadow-mypage-float fixed top-20 right-[clamp(1rem,5vw,20rem)] z-[70] flex w-[min(92vw,360px)] items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl">
      <span
        className={`mt-0.5 shrink-0 ${
          tone === 'success' ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        <Icon size={18} />
      </span>
      <p className="flex-1 text-sm/6 font-medium text-white">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="text-mypage-muted transition hover:text-white"
        aria-label="토스트 닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default ToastMessage;
