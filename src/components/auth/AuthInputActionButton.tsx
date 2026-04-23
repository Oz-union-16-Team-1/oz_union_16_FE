import type { ButtonHTMLAttributes, ReactNode } from 'react';

import AuthButton from './AuthButton';

type AuthInputActionButtonProps = {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function AuthInputActionButton({
  children,
  type = 'button',
  className = '',
  ...props
}: AuthInputActionButtonProps) {
  return (
    <AuthButton
      type={type}
      variant="secondary"
      className={`bg-login-field text-login-label w-full border border-white/16 text-sm font-semibold hover:border-[#ff6b6e]/60 hover:bg-[#261216] hover:text-[#ffd7d8] focus-visible:ring-[#ff5c60]/25 sm:w-[5.75rem] sm:shrink-0 ${className}`}
      {...props}
    >
      {children}
    </AuthButton>
  );
}

export default AuthInputActionButton;
