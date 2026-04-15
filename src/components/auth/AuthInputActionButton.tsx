import type { ReactNode } from 'react';

import AuthButton from './AuthButton';

type AuthInputActionButtonProps = {
  children: ReactNode;
};

function AuthInputActionButton({ children }: AuthInputActionButtonProps) {
  return (
    <AuthButton variant="secondary" className="w-24 shrink-0">
      {children}
    </AuthButton>
  );
}

export default AuthInputActionButton;
