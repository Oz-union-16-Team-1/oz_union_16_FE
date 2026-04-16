import type { FormEvent } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import AuthButton from '../components/auth/AuthButton';
import AuthDivider from '../components/auth/AuthDivider';
import AuthFormMessage from '../components/auth/AuthFormMessage';
import AuthLinkButton from '../components/auth/AuthLinkButton';
import AuthLayout from '../components/layout/AuthLayout';
import AuthInputField from '../components/auth/AuthInputField';
import AuthSocialLoginGroup from '../components/auth/AuthSocialLoginGroup';
import { ROUTES } from '../constants/routes';
import {
  getCurrentUserProfile,
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
} from '../features/auth/api/auth';
import { useLoginMutation } from '../features/auth/api/useAuthApi';
import type { LoginRequest } from '../features/auth/types/auth';
import { setAuthAccount, setAuthTokens } from '../utils/auth';

type LoginFieldName = keyof LoginRequest;
type LoginFieldErrors = Partial<Record<LoginFieldName, string>>;
type LoginTouchedState = Record<LoginFieldName, boolean>;
type LoginLocationState = {
  noticeMessage?: string;
};

const getLoginFieldErrors = (
  values: LoginRequest,
  touchedState: LoginTouchedState,
) => {
  const trimmedLoginId = values.login_id.trim();
  const trimmedPassword = values.password.trim();

  return {
    login_id:
      touchedState.login_id && !trimmedLoginId ? '아이디를 입력해주세요.' : '',
    password:
      touchedState.password && !trimmedPassword
        ? '비밀번호를 입력해주세요.'
        : '',
  } satisfies Record<LoginFieldName, string>;
};

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const [formValues, setFormValues] = useState<LoginRequest>({
    login_id: '',
    password: '',
  });
  const [touchedState, setTouchedState] = useState<LoginTouchedState>({
    login_id: false,
    password: false,
  });
  const [apiFieldErrors, setApiFieldErrors] = useState<LoginFieldErrors>({});
  const [formMessage, setFormMessage] = useState('');
  const locationState = location.state as LoginLocationState | null;
  const [noticeMessage, setNoticeMessage] = useState(
    locationState?.noticeMessage ?? '',
  );
  const fieldErrors = getLoginFieldErrors(formValues, touchedState);
  const resolvedFieldErrors: Record<LoginFieldName, string> = {
    login_id: apiFieldErrors.login_id ?? fieldErrors.login_id,
    password: apiFieldErrors.password ?? fieldErrors.password,
  };

  const handleChange = (fieldName: LoginFieldName, value: string) => {
    setFormValues((previous) => ({
      ...previous,
      [fieldName]: value,
    }));

    setApiFieldErrors((previous) => {
      if (!previous[fieldName]) {
        return previous;
      }

      return {
        ...previous,
        [fieldName]: '',
      };
    });

    setFormMessage('');
    setNoticeMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTouchedState = {
      login_id: true,
      password: true,
    } satisfies LoginTouchedState;

    setTouchedState(nextTouchedState);
    setApiFieldErrors({});
    setFormMessage('');
    setNoticeMessage('');

    const nextFieldErrors = getLoginFieldErrors(formValues, nextTouchedState);
    const hasLocalError = Object.values(nextFieldErrors).some(Boolean);

    if (hasLocalError) {
      return;
    }

    const payload: LoginRequest = {
      login_id: formValues.login_id.trim(),
      password: formValues.password.trim(),
    };

    try {
      const response = await loginMutation.mutateAsync(payload);

      setAuthTokens(response.access_token, response.refresh_token);
      const profile = await getCurrentUserProfile();
      setAuthAccount(profile);
      navigate(ROUTES.HOME);
    } catch (error) {
      const nextApiFieldErrors = extractAuthApiFieldErrors(error);

      if (Object.keys(nextApiFieldErrors).length > 0) {
        setApiFieldErrors(nextApiFieldErrors);
        return;
      }

      setFormMessage(extractAuthApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout title="Log In">
      <AuthSocialLoginGroup className="mt-8 sm:mt-10" />

      <AuthDivider className="my-6 sm:my-7" />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInputField
          id="login-id"
          name="login_id"
          label="아이디"
          type="text"
          autoComplete="username"
          placeholder="ID"
          value={formValues.login_id}
          onChange={(event) => handleChange('login_id', event.target.value)}
          onBlur={() =>
            setTouchedState((previous) => ({
              ...previous,
              login_id: true,
            }))
          }
          errorMessage={resolvedFieldErrors.login_id}
          disabled={loginMutation.isPending}
          containerClassName="pt-1"
        />

        <AuthInputField
          id="login-password"
          name="password"
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="PASSWORD"
          value={formValues.password}
          onChange={(event) => handleChange('password', event.target.value)}
          onBlur={() =>
            setTouchedState((previous) => ({
              ...previous,
              password: true,
            }))
          }
          errorMessage={resolvedFieldErrors.password}
          disabled={loginMutation.isPending}
        />

        {noticeMessage ? (
          <AuthFormMessage tone="success">{noticeMessage}</AuthFormMessage>
        ) : null}

        {formMessage ? <AuthFormMessage>{formMessage}</AuthFormMessage> : null}

        <div className="flex justify-end">
          <button
            type="button"
            className="text-login-muted text-sm font-medium transition-colors hover:text-white/80"
          >
            아이디/비밀번호를 잊어버리셨나요?
          </button>
        </div>

        <AuthButton
          type="submit"
          className="mt-4 w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? '로그인 중...' : '로그인'}
        </AuthButton>
      </form>

      <div className="border-login-divider mt-8 border-t pt-6 sm:mt-9 sm:pt-7">
        <p className="text-login-helper text-center text-sm/5 font-normal">
          아직 PGTI 회원이 아니신가요?
        </p>
        <AuthLinkButton
          to={`/${ROUTES.SIGNUP}`}
          className="mt-4 w-full sm:mt-5"
        >
          회원가입
        </AuthLinkButton>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
