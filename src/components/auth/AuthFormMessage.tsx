import type { ReactNode } from 'react';

type AuthFormMessageTone = 'error' | 'success';

type AuthFormMessageProps = {
  children: ReactNode;
  tone?: AuthFormMessageTone;
  className?: string;
};

const toneClassNames: Record<AuthFormMessageTone, string> = {
  error: 'border-red-500/20 bg-red-500/10 text-red-300',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
};

function AuthFormMessage({
  children,
  tone = 'error',
  className = '',
}: AuthFormMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm/5 font-medium ${toneClassNames[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export default AuthFormMessage;
