import type { InputHTMLAttributes, ReactNode } from 'react';
import InputControl from '../common/InputControl';

type AuthInputFieldMessageTone = 'success' | 'muted';

type AuthInputFieldProps = {
  id: string;
  label: string;
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
    <div className={`space-y-1.5 ${containerClassName} sm:space-y-2`}>
      <label
        htmlFor={id}
        className="text-login-label block text-sm font-medium"
      >
        {label}
      </label>
      <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
        <InputControl
          id={id}
          {...inputProps}
          hasError={Boolean(errorMessage)}
          className={`flex-1 ${className}`}
        />
        {action}
        {toast}
      </div>
      {shouldRenderMessage ? (
        <p
          role={errorMessage ? 'alert' : undefined}
          aria-hidden={!resolvedMessage}
          className={`${reserveMessageSpace ? 'min-h-5' : ''} pl-1 text-sm/5 font-medium ${resolvedMessage ? resolvedMessageClassName : 'text-transparent'}`}
        >
          {resolvedMessage ?? ''}
        </p>
      ) : null}
    </div>
  );
}

export default AuthInputField;
