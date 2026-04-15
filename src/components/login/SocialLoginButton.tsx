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
      className={`flex w-full items-center justify-center gap-3 rounded-full px-0 transition-transform duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {icon}
      <span className={`text-lg leading-7 font-normal ${labelClassName}`}>
        {label}
      </span>
    </button>
  );
}

export default SocialLoginButton;
