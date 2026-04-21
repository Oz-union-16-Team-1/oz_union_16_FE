import type { ReactNode } from 'react';

import AuthButton from '../auth/AuthButton';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="모달 닫기"
        onClick={onClose}
        className="bg-mypage-overlay absolute inset-0"
      />

      <div className="bg-mypage-panel border-mypage-panel shadow-mypage-float relative z-10 w-full max-w-md rounded-[28px] border px-5 py-6 backdrop-blur-xl sm:px-6">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <div className="text-mypage-muted mt-3 text-sm/6 sm:text-base/7">
          {description}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AuthButton
            type="button"
            variant="secondary"
            className="w-full sm:w-auto sm:min-w-28"
            onClick={onClose}
            disabled={isPending}
          >
            {cancelLabel}
          </AuthButton>
          <AuthButton
            type="button"
            className="bg-mypage-danger hover:bg-mypage-danger-hover w-full shadow-none sm:w-auto sm:min-w-32"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? '처리 중...' : confirmLabel}
          </AuthButton>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
