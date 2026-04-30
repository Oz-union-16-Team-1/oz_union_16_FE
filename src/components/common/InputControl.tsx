import type { InputHTMLAttributes } from 'react';

type InputControlProps = {
  hasError?: boolean;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const inputBaseClassName =
  'auth-input-autofill placeholder-login-muted bg-login-field block h-[3.15rem] min-h-[3.15rem] w-full min-w-0 max-w-none rounded-2xl border px-4 text-[0.98rem] leading-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition outline-none focus-visible:ring-2 sm:h-[3.25rem] sm:min-h-[3.25rem] sm:text-base';

function InputControl({
  hasError = false,
  className = '',
  'aria-invalid': ariaInvalid,
  ...props
}: InputControlProps) {
  return (
    <input
      aria-invalid={ariaInvalid ?? hasError}
      className={`${inputBaseClassName} ${hasError ? 'border-red-500/90 hover:border-red-400 focus-visible:border-red-400 focus-visible:ring-red-500/30' : 'border-login-field hover:border-white/24 focus-visible:border-[#ff5d61] focus-visible:ring-[#ff5d61]/28'} ${className}`}
      {...props}
    />
  );
}

export default InputControl;
