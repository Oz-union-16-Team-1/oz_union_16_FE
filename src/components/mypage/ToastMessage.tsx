import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type ToastMessageTone = 'success' | 'error';

type ToastMessageVariant = 'fixed' | 'fixedCenter' | 'absoluteCenter';

type ToastMessageProps = {
  message: string;
  tone?: ToastMessageTone;
  onClose: () => void;
  variant?: ToastMessageVariant;
  className?: string;
};

function ToastMessage({
  message,
  tone = 'success',
  onClose,
  variant = 'fixed',
  className = '',
}: ToastMessageProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  const positioningClass =
    variant === 'absoluteCenter'
      ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
      : variant === 'fixedCenter'
        ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
        : 'fixed top-20 right-[clamp(1rem,5vw,20rem)]';

  return (
    <div
      className={`bg-mypage-panel border-mypage-panel shadow-mypage-float z-[70] flex w-[min(92vw,360px)] items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl ${positioningClass} ${className}`}
    >
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
