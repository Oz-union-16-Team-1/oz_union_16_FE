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
      className={`w-full border-2 border-[#ff9a57] bg-[#fff4ea] text-sm font-semibold text-[#9a4316] shadow-[0_10px_24px_rgba(255,154,87,0.18)] hover:border-[#ff8a3d] hover:bg-[#ffead9] hover:text-[#7a2f08] sm:w-[5.75rem] sm:shrink-0 ${className}`}
      {...props}
    >
      {children}
    </AuthButton>
  );
}

export default AuthInputActionButton;
