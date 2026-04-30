import type { InputHTMLAttributes, ReactNode } from 'react';
import InputControl from '../common/InputControl';

type AuthInputFieldMessageTone = 'success' | 'muted';

type AuthInputFieldProps = {
  id: string;
  label: string;
  labelAction?: ReactNode;
  errorMessage?: string;
  helperMessage?: string;
  helperMessageTone?: AuthInputFieldMessageTone;
  reserveMessageSpace?: boolean;
  action?: ReactNode;
  toast?: ReactNode;
  containerClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

function AuthInputField({
  id,
  label,
  labelAction,
  errorMessage,
  helperMessage,
  helperMessageTone = 'muted',
  reserveMessageSpace = false,
  action,
  toast,
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
  const shouldRenderMessage = Boolean(resolvedMessage) || reserveMessageSpace;

  return (
    <div
      className={`w-full min-w-0 space-y-2 ${containerClassName} sm:space-y-2.5`}
    >
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-login-label block min-w-0 text-sm font-medium"
        >
          {label}
        </label>
        {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
      </div>
      <div className="relative flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
        <InputControl
          id={id}
          {...inputProps}
          hasError={Boolean(errorMessage)}
          className={`w-full min-w-0 flex-1 ${className}`}
        />
        {action}
        {toast}
      </div>
      {shouldRenderMessage ? (
        <p
          role={errorMessage ? 'alert' : undefined}
          aria-hidden={!resolvedMessage}
          className={`${reserveMessageSpace ? 'min-h-5' : ''} pt-0.5 pl-1 text-sm/5 font-medium ${resolvedMessage ? resolvedMessageClassName : 'text-transparent'}`}
        >
          {resolvedMessage ?? ''}
        </p>
      ) : null}
    </div>
  );
}

export default AuthInputField;
