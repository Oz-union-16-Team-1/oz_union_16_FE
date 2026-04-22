import type { ReactNode } from 'react';
import StatusMessage from '../common/StatusMessage';

type AuthFormMessageTone = 'error' | 'success';

type AuthFormMessageProps = {
  children: ReactNode;
  tone?: AuthFormMessageTone;
  className?: string;
};

function AuthFormMessage({
  children,
  tone = 'error',
  className = '',
}: AuthFormMessageProps) {
  return (
    <StatusMessage tone={tone} variant="surface" className={className}>
      {children}
    </StatusMessage>
  );
}

export default AuthFormMessage;
