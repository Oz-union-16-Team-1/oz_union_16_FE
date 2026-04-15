type AuthDividerProps = {
  label: string;
  className?: string;
};

function AuthDivider({ label, className = '' }: AuthDividerProps) {
  return (
    <div className={`flex items-center gap-4 py-1 ${className}`}>
      <div className="bg-login-divider-line h-px flex-1" />
      <span className="text-login-divider-label text-xs/5 font-normal tracking-[0.18em]">
        {label}
      </span>
      <div className="bg-login-divider-line h-px flex-1" />
    </div>
  );
}

export default AuthDivider;
