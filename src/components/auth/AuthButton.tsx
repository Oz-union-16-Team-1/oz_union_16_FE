import type { ButtonHTMLAttributes, ReactNode } from 'react';

type AuthButtonVariant = 'primary' | 'secondary' | 'ghost';

type AuthButtonProps = {
  children: ReactNode;
  variant?: AuthButtonVariant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseClassName =
  'flex h-14 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-60';

const variantClassNames: Record<AuthButtonVariant, string> = {
  primary:
    'shadow-login-primary bg-login-primary hover:bg-login-primary-hover rounded-full text-lg/7 font-semibold text-white',
  secondary:
    'bg-login-field border-login-field text-login-label hover:border-white/20 hover:text-white rounded-xl border text-sm/5 font-medium',
  ghost:
    'border-login-outline hover:border-white/25 hover:bg-white/5 rounded-full border bg-transparent text-lg/7 font-semibold text-white',
};

function AuthButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: AuthButtonProps) {
  return (
    <button
      type={type}
      className={`${baseClassName} ${variantClassNames[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default AuthButton;
