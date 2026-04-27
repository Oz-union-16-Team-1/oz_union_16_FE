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
      className={`h-12 w-full rounded-2xl border border-white/12 bg-white/[0.055] text-sm font-semibold text-white/82 hover:border-[#ff6b6e]/55 hover:bg-[#211316] hover:text-white focus-visible:ring-[#ff5c60]/28 active:scale-[0.99] sm:h-[3.2rem] sm:w-[5.75rem] sm:shrink-0 ${className}`}
      {...props}
    >
      {children}
    </AuthButton>
  );
}

export default AuthInputActionButton;
