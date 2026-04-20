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
    <fieldset className="space-y-3">
      <legend className="text-login-label block text-sm font-medium">
        {label}
      </legend>
      <div className="grid grid-cols-2 gap-3 pt-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="group block min-w-0 cursor-pointer"
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
              className={`flex h-14 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition-all group-hover:border-white/20 group-hover:text-white/85 peer-checked:border-[#ff8a3d] peer-checked:bg-[linear-gradient(135deg,rgba(255,138,61,0.24),rgba(255,110,48,0.1))] peer-checked:text-white peer-checked:shadow-[0_14px_32px_rgba(255,138,61,0.18)] peer-disabled:opacity-60 ${
                errorMessage
                  ? 'border-red-500/80 bg-white/[0.03] text-red-200'
                  : 'border-login-field text-login-helper bg-white/[0.03]'
              }`}
            >
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
