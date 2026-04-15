type AuthRadioOption = {
  label: string;
  value: string;
};

type AuthRadioGroupProps = {
  label: string;
  name: string;
  options: AuthRadioOption[];
  defaultValue?: string;
};

function AuthRadioGroup({
  label,
  name,
  options,
  defaultValue,
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
              defaultChecked={defaultValue === option.value}
              className="peer sr-only"
            />
            <span className="border-login-field peer-checked:border-login-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors">
              <span className="bg-login-primary h-2 w-2 rounded-full opacity-0 transition-opacity peer-checked:opacity-100" />
            </span>
            <span className="text-login-helper truncate text-sm/5 font-medium transition-colors peer-checked:text-white">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default AuthRadioGroup;
