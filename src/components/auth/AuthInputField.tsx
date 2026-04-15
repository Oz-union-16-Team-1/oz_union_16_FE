import type { ChangeEventHandler, FocusEventHandler, ReactNode } from 'react';

type AuthInputFieldProps = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'password' | 'email';
  autoComplete?: string;
  placeholder: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  errorMessage?: string;
  action?: ReactNode;
  containerClassName?: string;
};

function AuthInputField({
  id,
  name,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
  onBlur,
  errorMessage,
  action,
  containerClassName = '',
}: AuthInputFieldProps) {
  return (
    <div className={`space-y-2.5 ${containerClassName}`}>
      <label
        htmlFor={id}
        className="text-login-label block text-sm font-medium"
      >
        {label}
      </label>
      <div className="flex items-stretch gap-3">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(errorMessage)}
          className={`placeholder-login-muted bg-login-field h-14 min-w-0 flex-1 rounded-xl border px-4 text-base text-white transition outline-none focus-visible:ring-2 ${
            errorMessage
              ? 'border-red-500 focus-visible:ring-red-500/20'
              : 'border-login-field focus-visible:ring-white/20'
          }`}
        />
        {action}
      </div>
      {errorMessage ? (
        <p className="pl-1 text-sm/5 font-medium text-red-400">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export default AuthInputField;
