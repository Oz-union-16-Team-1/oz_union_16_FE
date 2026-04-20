import { useState } from 'react';

import AuthFormMessage from './AuthFormMessage';
import SocialLoginButton from '../login/SocialLoginButton';
import {
  getSocialLoginStartUrl,
  type SocialAuthProvider,
} from '../../features/auth/utils/socialAuth';

type AuthSocialLoginGroupProps = {
  className?: string;
  size?: 'default' | 'compact';
};

const GROUP_SIZE_CLASS_NAMES = {
  default: 'space-y-3 sm:space-y-3.5',
  compact: 'space-y-[clamp(0.625rem,1.8dvh,0.875rem)]',
} as const;

const BUTTON_SIZE_CLASS_NAMES = {
  default: {
    google: 'h-14 sm:h-[61px]',
    kakao: 'h-14 sm:h-[59px]',
    naver: 'h-14 sm:h-[59px]',
    label: '',
  },
  compact: {
    google: 'h-[clamp(3rem,6.5dvh,3.5rem)]',
    kakao: 'h-[clamp(3rem,6.5dvh,3.5rem)]',
    naver: 'h-[clamp(3rem,6.5dvh,3.5rem)]',
    label:
      'text-[clamp(0.95rem,2dvh,1.05rem)] leading-none sm:text-[clamp(0.95rem,2dvh,1.05rem)]',
  },
} as const;

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <path
      fill="#4285F4"
      d="M21.805 10.041H12.61v3.949h5.268c-.229 1.276-.955 2.356-2.036 3.083v2.526h3.304c1.937-1.783 3.056-4.41 3.056-7.548 0-.676-.061-1.315-.397-2.01Z"
    />
    <path
      fill="#34A853"
      d="M12.61 22.5c2.619 0 4.816-.867 6.421-2.352l-3.304-2.526c-.918.62-2.091.986-3.117.986-2.396 0-4.427-1.615-5.153-3.79H4.048v2.604A9.692 9.692 0 0 0 12.61 22.5Z"
    />
    <path
      fill="#FBBC04"
      d="M7.457 14.818a5.81 5.81 0 0 1-.291-1.818c0-.631.108-1.243.291-1.818V8.578H4.048A9.694 9.694 0 0 0 3 13c0 1.559.374 3.035 1.048 4.422l3.409-2.604Z"
    />
    <path
      fill="#EA4335"
      d="M12.61 7.392c1.422 0 2.697.489 3.703 1.447l2.777-2.777C17.421 4.509 15.229 3.5 12.61 3.5a9.692 9.692 0 0 0-8.562 5.078l3.409 2.604c.726-2.175 2.757-3.79 5.153-3.79Z"
    />
  </svg>
);

const KakaoIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <path
      fill="#181600"
      d="M12 4.2c-5.19 0-9.4 3.14-9.4 7.02 0 2.48 1.72 4.65 4.33 5.88l-1.08 3.96a.36.36 0 0 0 .55.4l4.57-3.1c.34.03.68.05 1.03.05 5.19 0 9.4-3.14 9.4-7.02S17.19 4.2 12 4.2Z"
    />
  </svg>
);

const NaverIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <path
      fill="currentColor"
      d="M6 5.5h4.57l2.94 4.19V5.5H18v13h-4.57l-2.94-4.19v4.19H6v-13Z"
    />
  </svg>
);

function AuthSocialLoginGroup({
  className = '',
  size = 'default',
}: AuthSocialLoginGroupProps) {
  const [redirectingProvider, setRedirectingProvider] =
    useState<SocialAuthProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const buttonSizeClassName = BUTTON_SIZE_CLASS_NAMES[size];

  const handleSocialLogin = (provider: SocialAuthProvider) => {
    try {
      const redirectUrl = getSocialLoginStartUrl(provider);
      setRedirectingProvider(provider);
      setErrorMessage('');
      window.location.assign(redirectUrl);
    } catch {
      setRedirectingProvider(null);
      setErrorMessage(
        '소셜 로그인 시작 주소를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <div className={`${GROUP_SIZE_CLASS_NAMES[size]} ${className}`}>
      <SocialLoginButton
        label="Google로 로그인하기"
        icon={<GoogleIcon />}
        className={`bg-login-google border-login-google border ${buttonSizeClassName.google}`}
        labelClassName={`text-white ${buttonSizeClassName.label}`}
        onClick={() => handleSocialLogin('google')}
        disabled={Boolean(redirectingProvider)}
      />
      <SocialLoginButton
        label="카카오로 로그인하기"
        icon={<KakaoIcon />}
        className={`bg-login-kakao ${buttonSizeClassName.kakao}`}
        labelClassName={`text-login-kakao-label ${buttonSizeClassName.label}`}
        onClick={() => handleSocialLogin('kakao')}
        disabled={Boolean(redirectingProvider)}
      />
      <SocialLoginButton
        label="네이버로 로그인하기"
        icon={<NaverIcon />}
        className={`bg-login-naver ${buttonSizeClassName.naver}`}
        labelClassName={`text-white ${buttonSizeClassName.label}`}
        onClick={() => handleSocialLogin('naver')}
        disabled={Boolean(redirectingProvider)}
      />
      {errorMessage ? <AuthFormMessage>{errorMessage}</AuthFormMessage> : null}
    </div>
  );
}

export default AuthSocialLoginGroup;
