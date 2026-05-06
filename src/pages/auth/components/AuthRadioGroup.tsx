import type { ChangeEventHandler } from 'react';

type AuthRadioOption = {
  label: string;
  value: string;
};

type AuthRadioGroupProps = {
  label: string;
  name: string;
  idPrefix?: string;
  options: readonly AuthRadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  errorMessage?: string;
  reserveMessageSpace?: boolean;
  required?: boolean;
  disabled?: boolean;
};

function AuthRadioGroup({
  label,
  name,
  idPrefix,
  options,
  value,
  defaultValue,
  onChange,
  errorMessage,
  reserveMessageSpace = false,
  required = false,
  disabled = false,
}: AuthRadioGroupProps) {
  const shouldRenderMessage = Boolean(errorMessage) || reserveMessageSpace;

  return (
    <fieldset className="w-full min-w-0 space-y-2.5">
      <legend className="text-login-label block text-sm font-medium">
        {label}
      </legend>
      <div className="grid min-w-0 grid-cols-2 gap-3 pt-1">
        {options.map((option) => {
          const inputId = `${idPrefix ?? name}-${option.value}`;

          return (
            <label
              key={option.value}
              className="group block min-w-0 cursor-pointer"
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={
                  value !== undefined ? value === option.value : undefined
                }
                defaultChecked={
                  value !== undefined
                    ? undefined
                    : defaultValue === option.value
                }
                onChange={onChange}
                required={required}
                disabled={disabled}
                className="peer sr-only"
              />
              <span
                className={`flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff5c60]/28 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black peer-disabled:opacity-60 sm:h-[3.2rem] ${
                  errorMessage
                    ? 'border-red-500/80 bg-[#1f1417] text-red-200 group-hover:border-red-400/90 group-hover:bg-[#2c171b] group-hover:text-red-100'
                    : 'bg-login-field text-login-label border-login-field group-hover:border-white/22 group-hover:bg-[#26282d] group-hover:text-white/88 peer-checked:border-[#ff666a]/78 peer-checked:bg-[#291518] peer-checked:text-white'
                }`}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {shouldRenderMessage ? (
        <p
          role={errorMessage ? 'alert' : undefined}
          aria-hidden={!errorMessage}
          className={`${reserveMessageSpace ? 'min-h-5' : ''} pl-1 text-sm/5 font-medium ${errorMessage ? 'text-red-400' : 'text-transparent'}`}
        >
          {errorMessage ?? ''}
        </p>
      ) : null}
    </fieldset>
  );
}

export default AuthRadioGroup;
