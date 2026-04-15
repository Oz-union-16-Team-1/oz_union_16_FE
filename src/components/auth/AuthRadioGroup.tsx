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
}: AuthRadioGroupProps) {
  return (
    <fieldset className="space-y-3.5">
      <legend className="text-login-label block text-sm font-medium">
        {label}
      </legend>
      <div className="flex items-center justify-between gap-3 pt-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2"
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
              className="peer sr-only"
            />
            <span
              className={`peer-checked:border-login-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                errorMessage ? 'border-red-500' : 'border-login-field'
              }`}
            >
              <span className="bg-login-primary h-2 w-2 rounded-full opacity-0 transition-opacity peer-checked:opacity-100" />
            </span>
            <span className="text-login-helper truncate text-sm/5 font-medium transition-colors peer-checked:text-white">
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
