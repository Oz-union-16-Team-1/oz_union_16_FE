import type { ReactNode } from 'react';

export type StatusMessageTone = 'error' | 'success' | 'muted';
export type StatusMessageVariant = 'surface' | 'inline';

type StatusMessageProps = {
  children: ReactNode;
  tone?: StatusMessageTone;
  variant?: StatusMessageVariant;
  className?: string;
  role?: 'alert' | 'status';
  ariaLive?: 'off' | 'polite' | 'assertive';
};

const baseClassName = 'text-sm/5 font-medium';

const variantClassNames: Record<StatusMessageVariant, string> = {
  surface: 'rounded-xl border px-4 py-3',
  inline: '',
};

const toneClassNames: Record<
  StatusMessageVariant,
  Record<StatusMessageTone, string>
> = {
  surface: {
    error: 'border-red-500/20 bg-red-500/10 text-red-300',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    muted: 'border-white/12 bg-white/3 text-white/70',
  },
  inline: {
    error: 'text-red-400',
    success: 'text-emerald-400',
    muted: 'text-login-helper',
  },
};

function StatusMessage({
  children,
  tone = 'error',
  variant = 'surface',
  className = '',
  role,
  ariaLive,
}: StatusMessageProps) {
  const resolvedRole = role ?? (tone === 'error' ? 'alert' : 'status');
  const resolvedAriaLive =
    ariaLive ?? (tone === 'error' ? 'assertive' : 'polite');

  return (
    <p
      role={resolvedRole}
      aria-live={resolvedAriaLive}
      aria-atomic="true"
      className={`${baseClassName} ${variantClassNames[variant]} ${toneClassNames[variant][tone]} ${className}`}
    >
      {children}
    </p>
  );
}

export default StatusMessage;
