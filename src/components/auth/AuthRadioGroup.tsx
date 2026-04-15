import type { ChangeEventHandler } from 'react';

type AuthRadioOption = {
  label: string;
  value: string;
};

type AuthRadioGroupProps = {
  label: string;
  name: string;
  options: readonly AuthRadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
};

function AuthRadioGroup({
  label,
  name,
  options,
  value,
  defaultValue,
  onChange,
  errorMessage,
  required = false,
  disabled = false,
}: AuthRadioGroupProps) {
  return (
    <fieldset className="space-y-3.5">
      <legend className="text-login-label block text-sm font-medium">
        {label}
      </legend>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1 sm:flex-nowrap sm:justify-between">
        {options.map((option) => (
          <label
            key={option.value}
            className="group flex min-w-0 flex-1 cursor-pointer items-center justify-start gap-2 sm:justify-center"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value !== undefined ? value === option.value : undefined}
              defaultChecked={
                value !== undefined ? undefined : defaultValue === option.value
              }
              onChange={onChange}
              required={required}
              disabled={disabled}
              className="peer sr-only"
            />
            <span
              className={`peer-checked:border-login-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors group-hover:border-white/25 peer-disabled:opacity-60 ${
                errorMessage ? 'border-red-500' : 'border-login-field'
              }`}
            >
              <span className="bg-login-primary h-2 w-2 rounded-full opacity-0 transition-opacity peer-checked:opacity-100" />
            </span>
            <span className="text-login-helper text-sm/5 font-medium transition-colors group-hover:text-white/85 peer-checked:text-white peer-disabled:opacity-60">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {errorMessage ? (
        <p className="pl-1 text-sm/5 font-medium text-red-400">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}

export default AuthRadioGroup;
