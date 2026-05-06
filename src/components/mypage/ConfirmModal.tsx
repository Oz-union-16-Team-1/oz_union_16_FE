import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

import AuthButton from '../auth/AuthButton';

const FOCUSABLE_ELEMENT_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR),
  ).filter((element) => {
    if (element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    return (
      element.offsetWidth > 0 ||
      element.offsetHeight > 0 ||
      element.getClientRects().length > 0
    );
  });

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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusInitialElement = () => {
      const modalElement = modalRef.current;

      if (!modalElement) {
        return;
      }

      const [firstFocusableElement] = getFocusableElements(modalElement);
      (firstFocusableElement ?? modalElement).focus({ preventScroll: true });
    };

    const animationFrameId = window.requestAnimationFrame(focusInitialElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      const modalElement = modalRef.current;

      if (!modalElement) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(modalElement);

      if (focusableElements.length === 0) {
        event.preventDefault();
        modalElement.focus({ preventScroll: true });
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const activeElement = document.activeElement;

      if (!modalElement.contains(activeElement)) {
        event.preventDefault();
        firstFocusableElement.focus({ preventScroll: true });
        return;
      }

      const activeElementIndex = focusableElements.findIndex(
        (element) => element === activeElement,
      );

      if (activeElementIndex === -1) {
        event.preventDefault();
        firstFocusableElement.focus({ preventScroll: true });
        return;
      }

      const nextElementIndex = event.shiftKey
        ? activeElementIndex - 1
        : activeElementIndex + 1;
      const nextElement =
        focusableElements[
          (nextElementIndex + focusableElements.length) %
            focusableElements.length
        ];

      if (!nextElement) {
        return;
      }

      event.preventDefault();
      nextElement.focus({ preventScroll: true });
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener('keydown', handleKeyDown);

      previousFocusedElementRef.current?.focus({ preventScroll: true });
      previousFocusedElementRef.current = null;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-80 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="bg-mypage-overlay absolute inset-0 cursor-pointer backdrop-blur-[3px]"
      />

      <div className="bg-mypage-panel relative z-10 w-full max-w-md rounded-[28px] border border-white/12 px-5 py-6 shadow-[0_38px_100px_rgba(0,0,0,0.58)] ring-1 ring-white/6 backdrop-blur-xl sm:px-6">
        <h2
          id={titleId}
          className={`text-2xl font-semibold text-white ${align === 'center' ? 'text-center' : ''}`}
        >
          {title}
        </h2>
        <div
          id={descriptionId}
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
