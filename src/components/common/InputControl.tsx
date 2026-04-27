import type { InputHTMLAttributes } from 'react';

type InputControlProps = {
  hasError?: boolean;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const inputBaseClassName =
  'auth-input-autofill placeholder-login-muted bg-login-field h-12 min-w-0 w-full rounded-2xl border px-3.5 text-[0.95rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition outline-none focus-visible:ring-2 sm:h-[3.2rem] sm:px-4 sm:text-base';

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
