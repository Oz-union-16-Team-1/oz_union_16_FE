import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

type ActionButtonProps = {
  children: ReactNode;
  variant?: ActionButtonVariant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseClassName =
  'inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60';

const variantClassNames: Record<ActionButtonVariant, string> = {
  primary:
    'shadow-login-primary bg-login-primary hover:bg-login-primary-hover rounded-full text-lg/7 font-semibold text-white hover:-translate-y-0.5 focus-visible:ring-red-500/30',
  secondary:
    'bg-login-field border-login-field text-login-label rounded-xl border text-sm/5 font-medium hover:-translate-y-0.5 hover:border-white/20 hover:text-white focus-visible:ring-white/15',
  ghost:
    'border-login-outline rounded-full border bg-transparent text-lg/7 font-semibold text-white hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/5 focus-visible:ring-white/15',
  icon: 'h-9 w-9 rounded-full border border-white/10 bg-white/2 text-white/60 hover:border-white/20 hover:bg-white/4 hover:text-white/90 focus-visible:ring-white/20',
};

function ActionButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`${baseClassName} ${variantClassNames[variant]} ${variant !== 'icon' ? 'h-14' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default ActionButton;
