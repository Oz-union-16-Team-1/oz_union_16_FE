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
      className="w-24 shrink-0"
      {...props}
    >
      {children}
    </AuthButton>
  );
}

export default AuthInputActionButton;
