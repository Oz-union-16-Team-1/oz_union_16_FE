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
import { useAuthStore } from '../store/useAuthStore';

type LoginFieldName = keyof LoginRequest;
type LoginFieldErrors = Partial<Record<LoginFieldName, string>>;
type LoginTouchedState = Record<LoginFieldName, boolean>;
type LoginLocationState = {
  noticeMessage?: string;
  errorMessage?: string;
};

const LOGIN_MAIN_CLASS_NAME = 'min-h-0 py-3 sm:py-4';
const LOGIN_PANEL_CLASS_NAME =
  'max-w-[500px] max-h-[calc(100dvh-4rem-1.5rem)] overflow-y-auto overscroll-contain recommendation-scroll px-[clamp(1rem,3vw,1.75rem)] py-[clamp(1.25rem,3.6dvh,2rem)] sm:max-h-[calc(100dvh-4rem-2rem)] sm:px-[clamp(1.25rem,3vw,2rem)] sm:py-[clamp(1.5rem,4dvh,2.25rem)]';
const LOGIN_CONTENT_CLASS_NAME = 'max-w-[420px]';
const LOGIN_TITLE_CLASS_NAME = 'text-[clamp(2.25rem,5dvh,3rem)]';
const LOGIN_SOCIAL_GROUP_CLASS_NAME = 'mt-[clamp(1rem,2.5dvh,1.75rem)]';
const LOGIN_DIVIDER_CLASS_NAME = 'my-[clamp(0.875rem,2.4dvh,1.5rem)]';
const LOGIN_FORM_CLASS_NAME = 'space-y-[clamp(0.75rem,2.2dvh,1rem)]';
const LOGIN_FIELD_CLASS_NAME =
  'h-[clamp(3rem,6.5dvh,3.5rem)] px-[clamp(0.875rem,2vw,1rem)] text-[clamp(0.95rem,2dvh,1rem)]';
const LOGIN_PRIMARY_BUTTON_CLASS_NAME =
  'mt-[clamp(0.75rem,2dvh,1rem)] h-[clamp(3rem,6.5dvh,3.5rem)] text-[clamp(1rem,2.2dvh,1.125rem)] leading-none';
const LOGIN_SECONDARY_BUTTON_CLASS_NAME =
  'mt-[clamp(0.75rem,2dvh,1.25rem)] h-[clamp(3rem,6.5dvh,3.5rem)] text-[clamp(1rem,2.2dvh,1.125rem)] leading-none';
const LOGIN_SIGNUP_SECTION_CLASS_NAME =
  'border-login-divider mt-[clamp(1rem,2.5dvh,1.75rem)] border-t pt-[clamp(0.875rem,2.2dvh,1.5rem)]';

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
  const setAuth = useAuthStore((state) => state.setAuth);
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
  const locationState = location.state as LoginLocationState | null;
  const [formMessage, setFormMessage] = useState(
    locationState?.errorMessage ?? '',
  );
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

      // [Refactor] #94: Access Token 메모리 저장, Refresh Token은 HttpOnly 쿠키로 관리됨
      const profile = await getCurrentUserProfile();
      setAuth(response.access_token, profile);

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
    <AuthLayout
      title="Log In"
      withPanel
      titleClassName={LOGIN_TITLE_CLASS_NAME}
      mainClassName={LOGIN_MAIN_CLASS_NAME}
      panelClassName={LOGIN_PANEL_CLASS_NAME}
      contentClassName={LOGIN_CONTENT_CLASS_NAME}
    >
      <AuthSocialLoginGroup
        className={LOGIN_SOCIAL_GROUP_CLASS_NAME}
        size="compact"
      />

      <AuthDivider className={LOGIN_DIVIDER_CLASS_NAME} />

      <form className={LOGIN_FORM_CLASS_NAME} onSubmit={handleSubmit}>
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
          containerClassName="pt-[clamp(0.125rem,0.7dvh,0.25rem)]"
          className={LOGIN_FIELD_CLASS_NAME}
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
          className={LOGIN_FIELD_CLASS_NAME}
        />

        {noticeMessage ? (
          <AuthFormMessage tone="success">{noticeMessage}</AuthFormMessage>
        ) : null}

        {formMessage ? <AuthFormMessage>{formMessage}</AuthFormMessage> : null}

        <div className="flex justify-end">
          <button
            type="button"
            className="text-login-muted text-[clamp(0.75rem,1.7dvh,0.875rem)] font-medium transition-colors hover:text-white/80"
          >
            아이디/비밀번호를 잊어버리셨나요?
          </button>
        </div>

        <AuthButton
          type="submit"
          className={`w-full ${LOGIN_PRIMARY_BUTTON_CLASS_NAME}`}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? '로그인 중...' : '로그인'}
        </AuthButton>
      </form>

      <div className={LOGIN_SIGNUP_SECTION_CLASS_NAME}>
        <p className="text-login-helper text-center text-[clamp(0.75rem,1.8dvh,0.875rem)] leading-5 font-normal">
          아직 PGTI 회원이 아니신가요?
        </p>
        <AuthLinkButton
          to={`/${ROUTES.SIGNUP}`}
          className={`w-full ${LOGIN_SECONDARY_BUTTON_CLASS_NAME}`}
        >
          회원가입
        </AuthLinkButton>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
