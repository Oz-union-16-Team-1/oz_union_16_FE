import type { ReactNode } from 'react';

import AuthButton from '../auth/AuthButton';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isPending?: boolean;
  align?: 'left' | 'center';
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
  align = 'left',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="모달 닫기"
        onClick={onClose}
        className="bg-mypage-overlay absolute inset-0 cursor-pointer backdrop-blur-[3px]"
      />

      <div className="bg-mypage-panel relative z-10 w-full max-w-md rounded-[28px] border border-white/12 px-5 py-6 shadow-[0_38px_100px_rgba(0,0,0,0.58)] ring-1 ring-white/6 backdrop-blur-xl sm:px-6">
        <h2
          className={`text-2xl font-semibold text-white ${align === 'center' ? 'text-center' : ''}`}
        >
          {title}
        </h2>
        <div
          className={`text-mypage-muted mt-3 text-sm/6 sm:text-base/7 ${align === 'center' ? 'text-center' : ''}`}
        >
          {description}
        </div>

        <div
          className={`mt-6 border-t border-white/8 pt-5 ${align === 'center' ? 'text-center' : ''}`}
        >
          <div
            className={`flex flex-col-reverse gap-3 sm:flex-row ${align === 'center' ? 'sm:justify-center' : 'sm:justify-end'}`}
          >
            <AuthButton
              type="button"
              variant="secondary"
              className={`h-12 w-full rounded-[20px] border-white/12 bg-white/[0.05] px-6 text-sm font-semibold text-white/88 shadow-none hover:translate-y-0 ${align === 'center' ? 'sm:w-40 sm:min-w-40' : 'sm:w-auto sm:min-w-[7.75rem]'}`}
              onClick={onClose}
              disabled={isPending}
            >
              {cancelLabel}
            </AuthButton>
            <AuthButton
              type="button"
              variant="secondary"
              className={`bg-login-primary hover:bg-login-primary-hover h-12 w-full rounded-[20px] border border-transparent px-6 text-sm font-semibold text-white shadow-none hover:translate-y-0 ${align === 'center' ? 'sm:w-40 sm:min-w-40' : 'sm:w-auto sm:min-w-[7.75rem]'}`}
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? '처리 중...' : confirmLabel}
            </AuthButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
