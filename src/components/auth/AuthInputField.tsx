import type { InputHTMLAttributes, ReactNode } from 'react';

type AuthInputFieldMessageTone = 'success' | 'muted';

type AuthInputFieldProps = {
  id: string;
  label: string;
  errorMessage?: string;
  helperMessage?: string;
  helperMessageTone?: AuthInputFieldMessageTone;
  action?: ReactNode;
  containerClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

function AuthInputField({
  id,
  label,
  errorMessage,
  helperMessage,
  helperMessageTone = 'muted',
  action,
  containerClassName = '',
  className = '',
  ...inputProps
}: AuthInputFieldProps) {
  const resolvedMessage = errorMessage ?? helperMessage;
  const resolvedMessageClassName = errorMessage
    ? 'text-red-400'
    : helperMessageTone === 'success'
      ? 'text-emerald-400'
      : 'text-login-helper';

  return (
    <div className={`space-y-2 ${containerClassName} sm:space-y-2.5`}>
      <label
        htmlFor={id}
        className="text-login-label block text-sm font-medium"
      >
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          id={id}
          {...inputProps}
          aria-invalid={Boolean(errorMessage)}
          className={`auth-input-autofill placeholder-login-muted bg-login-field h-14 min-w-0 flex-1 rounded-xl border px-4 text-base text-white transition outline-none focus-visible:ring-2 ${className} ${
            errorMessage
              ? 'border-red-500 hover:border-red-400 focus-visible:ring-red-500/20'
              : 'border-login-field hover:border-white/15 focus-visible:ring-white/20'
          }`}
        />
        {action}
      </div>
      {resolvedMessage ? (
        <p className={`pl-1 text-sm/5 font-medium ${resolvedMessageClassName}`}>
          {resolvedMessage}
        </p>
      ) : null}
    </div>
  );
}

export default AuthInputField;
