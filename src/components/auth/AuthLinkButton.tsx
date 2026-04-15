import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

type AuthLinkButtonVariant = 'ghost';

type AuthLinkButtonProps = {
  variant?: AuthLinkButtonVariant;
  className?: string;
  children: ReactNode;
} & LinkProps;

const baseClassName =
  'flex h-14 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-60';

const variantClassNames: Record<AuthLinkButtonVariant, string> = {
  ghost:
    'border-login-outline hover:border-white/25 hover:bg-white/5 rounded-full border bg-transparent text-lg/7 font-semibold text-white',
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
