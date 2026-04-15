import AuthInputField from '../components/auth/AuthInputField';
import SocialLoginButton from '../components/login/SocialLoginButton';
import AuthLayout from '../components/layout/AuthLayout';

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

function LoginPage() {
  return (
    <AuthLayout title="Log In">
      <div className="mt-12 space-y-4">
        <SocialLoginButton
          label="Google로 로그인하기"
          icon={<GoogleIcon />}
          className="bg-login-google border-login-google h-[61px] border"
          labelClassName="text-white"
        />
        <SocialLoginButton
          label="카카오로 로그인하기"
          icon={<KakaoIcon />}
          className="bg-login-kakao h-[59px]"
          labelClassName="text-login-kakao-label"
        />
        <SocialLoginButton
          label="네이버로 로그인하기"
          icon={<NaverIcon />}
          className="bg-login-naver h-[59px]"
          labelClassName="text-white"
        />
      </div>

      <div className="my-8 flex h-[34px] items-center gap-4 py-2">
        <div className="bg-login-divider-line h-px flex-1" />
        <span className="text-login-divider-label text-xs leading-5 font-normal tracking-[0.18em]">
          OR
        </span>
        <div className="bg-login-divider-line h-px flex-1" />
      </div>

      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <AuthInputField
          id="login-id"
          name="id"
          label="아이디"
          type="text"
          autoComplete="username"
          placeholder="ID"
        />

        <AuthInputField
          id="login-password"
          name="password"
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="PASSWORD"
        />

        <div className="flex justify-end">
          <button
            type="button"
            className="text-login-muted text-sm font-medium transition-colors hover:text-white/80"
          >
            아이디/비밀번호를 잊어버리셨나요?
          </button>
        </div>

        <button
          type="submit"
          className="shadow-login-primary bg-login-primary hover:bg-login-primary-hover mt-4 h-14 w-full rounded-full text-lg leading-7 font-semibold text-white transition-colors"
        >
          로그인
        </button>
      </form>

      <div className="border-login-divider mt-8 border-t pt-8">
        <p className="text-login-helper text-center text-sm leading-5 font-normal">
          아직 PGTI 회원이 아니신가요?
        </p>
        <button
          type="button"
          className="border-login-outline mt-5 h-14 w-full rounded-full border bg-transparent text-lg leading-7 font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/5"
        >
          회원가입
        </button>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
