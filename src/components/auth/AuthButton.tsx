import type { ButtonHTMLAttributes, ReactNode } from 'react';
import ActionButton from '../common/ActionButton';

type AuthButtonVariant = 'primary' | 'secondary' | 'ghost';

type AuthButtonProps = {
  children: ReactNode;
  variant?: AuthButtonVariant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function AuthButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: AuthButtonProps) {
  return (
    <ActionButton
      type={type}
      variant={variant}
      className={className}
      {...props}
    >
      {children}
    </ActionButton>
  );
}

export default AuthButton;
