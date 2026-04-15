import type { ReactNode } from 'react';

type SocialLoginButtonProps = {
  label: string;
  icon: ReactNode;
  className: string;
  labelClassName?: string;
};

function SocialLoginButton({
  label,
  icon,
  className,
  labelClassName = '',
}: SocialLoginButtonProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-center gap-3 rounded-full px-0 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:translate-y-0 ${className}`}
    >
      {icon}
      <span className={`text-lg/7 font-normal ${labelClassName}`}>{label}</span>
    </button>
  );
}

export default SocialLoginButton;
