type AuthInputFieldProps = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'password' | 'email';
  autoComplete?: string;
  placeholder: string;
};

function AuthInputField({
  id,
  name,
  label,
  type,
  autoComplete,
  placeholder,
}: AuthInputFieldProps) {
  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="text-login-label block text-[15px] font-medium"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="placeholder-login-muted bg-login-field border-login-field h-[56px] w-full rounded-[12px] border px-4 text-base text-white transition outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      />
    </div>
  );
}

export default AuthInputField;
