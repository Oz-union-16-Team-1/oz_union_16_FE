import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

type AuthLinkButtonVariant = 'ghost';

type AuthLinkButtonProps = {
  variant?: AuthLinkButtonVariant;
  className?: string;
  children: ReactNode;
} & LinkProps;

const baseClassName =
  'flex h-14 items-center justify-center transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60';

const variantClassNames: Record<AuthLinkButtonVariant, string> = {
  ghost:
    'border-login-outline active:translate-y-0 rounded-full border bg-transparent text-lg/7 font-semibold text-white hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
};

function AuthLinkButton({
  variant = 'ghost',
  className = '',
  children,
  ...props
}: AuthLinkButtonProps) {
  return (
    <Link
      className={`${baseClassName} ${variantClassNames[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export default AuthLinkButton;
