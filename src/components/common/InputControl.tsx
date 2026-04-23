import type { InputHTMLAttributes } from 'react';

type InputControlProps = {
  hasError?: boolean;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const inputBaseClassName =
  'auth-input-autofill placeholder-login-muted bg-login-field h-12 min-w-0 w-full rounded-xl border px-3.5 text-[0.95rem] text-white transition outline-none focus-visible:ring-2 sm:h-[3.2rem] sm:px-4 sm:text-base';

function InputControl({
  hasError = false,
  className = '',
  'aria-invalid': ariaInvalid,
  ...props
}: InputControlProps) {
  return (
    <input
      aria-invalid={ariaInvalid ?? hasError}
      className={`${inputBaseClassName} ${hasError ? 'border-red-500 hover:border-red-400 focus-visible:border-red-400 focus-visible:ring-red-500/25' : 'border-login-field hover:border-white/20 focus-visible:border-white/35 focus-visible:ring-white/25'} ${className}`}
      {...props}
    />
  );
}

export default InputControl;
