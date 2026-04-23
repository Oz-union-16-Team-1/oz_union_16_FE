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
      className={`h-12 w-full border border-[#5b3035] bg-[#1d1215] text-sm font-semibold text-[#f2d8d9] hover:border-[#ff6b6e]/65 hover:bg-[#29161a] hover:text-white focus-visible:ring-[#ff5c60]/25 active:scale-[0.99] sm:h-[3.2rem] sm:w-[5.75rem] sm:shrink-0 ${className}`}
      {...props}
    >
      {children}
    </AuthButton>
  );
}

export default AuthInputActionButton;
