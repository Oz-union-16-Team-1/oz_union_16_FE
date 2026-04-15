import type { ButtonHTMLAttributes, ReactNode } from 'react';

type AuthButtonVariant = 'primary' | 'secondary' | 'ghost';

type AuthButtonProps = {
  children: ReactNode;
  variant?: AuthButtonVariant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseClassName =
  'flex h-14 items-center justify-center transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60';

const variantClassNames: Record<AuthButtonVariant, string> = {
  primary:
    'shadow-login-primary bg-login-primary hover:bg-login-primary-hover active:translate-y-0 rounded-full text-lg/7 font-semibold text-white hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  secondary:
    'bg-login-field border-login-field text-login-label active:translate-y-0 rounded-xl border text-sm/5 font-medium hover:-translate-y-0.5 hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  ghost:
    'border-login-outline active:translate-y-0 rounded-full border bg-transparent text-lg/7 font-semibold text-white hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
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
