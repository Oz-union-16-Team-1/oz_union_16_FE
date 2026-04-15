import type { ButtonHTMLAttributes, ReactNode } from 'react';

import AuthButton from './AuthButton';

type AuthInputActionButtonProps = {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function AuthInputActionButton({
  children,
  type = 'button',
  ...props
}: AuthInputActionButtonProps) {
  return (
    <AuthButton
      type={type}
      variant="secondary"
      className="w-full sm:w-24 sm:shrink-0"
      {...props}
    >
      {children}
    </AuthButton>
  );
}

export default AuthInputActionButton;
