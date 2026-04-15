import AuthButton from '../components/auth/AuthButton';
import AuthDivider from '../components/auth/AuthDivider';
import AuthLinkButton from '../components/auth/AuthLinkButton';
import AuthLayout from '../components/layout/AuthLayout';
import AuthInputField from '../components/auth/AuthInputField';
import AuthSocialLoginGroup from '../components/auth/AuthSocialLoginGroup';
import { ROUTES } from '../constants/routes';

function LoginPage() {
  return (
    <AuthLayout title="Log In">
      <AuthSocialLoginGroup className="mt-10" />

      <AuthDivider className="my-7" />

      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <AuthInputField
          id="login-id"
          name="login_id"
          label="아이디"
          type="text"
          autoComplete="username"
          placeholder="ID"
          containerClassName="pt-1"
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

        <AuthButton type="submit" className="mt-4 w-full">
          로그인
        </AuthButton>
      </form>

      <div className="border-login-divider mt-9 border-t pt-7">
        <p className="text-login-helper text-center text-sm/5 font-normal">
          아직 PGTI 회원이 아니신가요?
        </p>
        <AuthLinkButton to={`/${ROUTES.SIGNUP}`} className="mt-5 w-full">
          회원가입
        </AuthLinkButton>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
