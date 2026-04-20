import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
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
import { mockServiceWorkerEnabled } from '../lib/env';
import { useAuthStore } from '../store/useAuthStore';

type LoginFieldName = keyof LoginRequest;
type LoginFieldErrors = Partial<Record<LoginFieldName, string>>;
type LoginTouchedState = Record<LoginFieldName, boolean>;
type LoginLocationState = {
  noticeMessage?: string;
  errorMessage?: string;
};

type DevMockLoginAccount = {
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  gender: string;
  note: string;
};

const LOGIN_MAIN_CLASS_NAME = 'min-h-0 py-1 sm:py-1.5';
const LOGIN_PANEL_CLASS_NAME =
  'max-w-[452px] px-[clamp(0.75rem,1.7vw,1.25rem)] py-[clamp(0.75rem,1.6dvh,1rem)] sm:px-[clamp(0.875rem,2vw,1.5rem)] sm:py-[clamp(0.875rem,1.9dvh,1.25rem)]';
const LOGIN_CONTENT_CLASS_NAME = 'max-w-[360px]';
const LOGIN_PANEL_WITH_MOCKS_CLASS_NAME =
  'max-w-[760px] px-[clamp(0.75rem,1.8vw,1.5rem)] py-[clamp(0.75rem,1.6dvh,1.25rem)] sm:px-[clamp(0.875rem,2.2vw,1.75rem)] sm:py-[clamp(0.875rem,1.9dvh,1.5rem)]';
const LOGIN_CONTENT_WITH_MOCKS_CLASS_NAME = 'max-w-[700px]';
const LOGIN_TITLE_CLASS_NAME = 'text-[clamp(1.75rem,3.6dvh,2.375rem)]';
const LOGIN_SOCIAL_GROUP_CLASS_NAME = 'mt-[clamp(0.5rem,1.2dvh,0.875rem)]';
const LOGIN_DIVIDER_CLASS_NAME =
  'my-[clamp(0.5rem,1.2dvh,0.75rem)] gap-2.5 py-0';
const LOGIN_FORM_CLASS_NAME = 'space-y-[clamp(0.5rem,1.25dvh,0.75rem)]';
const LOGIN_FIELD_CLASS_NAME =
  'h-[clamp(2.5rem,4.8dvh,2.75rem)] rounded-[0.875rem] px-[clamp(0.75rem,1.5vw,0.9375rem)] text-[clamp(0.85rem,1.45dvh,0.9375rem)]';
const LOGIN_PRIMARY_BUTTON_CLASS_NAME =
  'mt-[clamp(0.375rem,1dvh,0.625rem)] h-[clamp(2.5rem,4.8dvh,2.75rem)] text-[clamp(0.9rem,1.55dvh,1rem)] leading-none';
const LOGIN_SECONDARY_BUTTON_CLASS_NAME =
  'mt-[clamp(0.5rem,1.2dvh,0.75rem)] h-[clamp(2.5rem,4.8dvh,2.75rem)] text-[clamp(0.9rem,1.55dvh,1rem)] leading-none';
const LOGIN_SIGNUP_SECTION_CLASS_NAME =
  'border-login-divider mt-[clamp(0.625rem,1.4dvh,0.875rem)] border-t pt-[clamp(0.5rem,1.2dvh,0.75rem)]';
const LOGIN_CONTENT_GRID_CLASS_NAME =
  'grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start';
const LOGIN_MOCK_PANEL_CLASS_NAME =
  'bg-login-field/55 border-login-outline mt-[clamp(0.5rem,1.2dvh,0.875rem)] rounded-2xl border px-4 py-4 lg:mt-[clamp(0.5rem,1.2dvh,0.875rem)]';

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
  const [mockAccounts, setMockAccounts] = useState<DevMockLoginAccount[]>([]);

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
  const showMockAccounts = mockServiceWorkerEnabled && mockAccounts.length > 0;

  useEffect(() => {
    if (!mockServiceWorkerEnabled) {
      return;
    }

    let isMounted = true;

    void import('../features/auth/mocks/mockUsers')
      .then(({ mockLoginAccounts }) => {
        if (!isMounted) {
          return;
        }

        setMockAccounts(mockLoginAccounts);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setMockAccounts([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleApplyMockAccount = (account: DevMockLoginAccount) => {
    setFormValues({
      login_id: account.loginId,
      password: account.password,
    });
    setTouchedState({
      login_id: false,
      password: false,
    });
    setApiFieldErrors({});
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
      panelClassName={
        showMockAccounts
          ? LOGIN_PANEL_WITH_MOCKS_CLASS_NAME
          : LOGIN_PANEL_CLASS_NAME
      }
      contentClassName={
        showMockAccounts
          ? LOGIN_CONTENT_WITH_MOCKS_CLASS_NAME
          : LOGIN_CONTENT_CLASS_NAME
      }
    >
      <div className={showMockAccounts ? LOGIN_CONTENT_GRID_CLASS_NAME : ''}>
        <div>
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
              containerClassName="pt-[clamp(0.125rem,0.3dvh,0.1875rem)]"
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

            {formMessage ? (
              <AuthFormMessage>{formMessage}</AuthFormMessage>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                className="text-login-muted text-[clamp(0.675rem,1.1dvh,0.75rem)] font-medium transition-colors hover:text-white/80"
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
            <p className="text-login-helper text-center text-[clamp(0.675rem,1.15dvh,0.75rem)] leading-[1.1rem] font-normal">
              아직 PGTI 회원이 아니신가요?
            </p>
            <AuthLinkButton
              to={`/${ROUTES.SIGNUP}`}
              className={`w-full ${LOGIN_SECONDARY_BUTTON_CLASS_NAME}`}
            >
              회원가입
            </AuthLinkButton>
          </div>
        </div>

        {showMockAccounts ? (
          <aside className={LOGIN_MOCK_PANEL_CLASS_NAME}>
            <p className="text-sm font-semibold text-white">
              개발용 로그인 계정
            </p>
            <p className="text-login-helper mt-1 text-xs/5">
              개발 환경에서 MSW를 사용할 때만 표시됩니다.
            </p>
            <ul className="mt-3 space-y-2.5">
              {mockAccounts.map((account) => (
                <li
                  key={account.loginId}
                  className="border-login-outline rounded-2xl border bg-black/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {account.name}
                      </p>
                      <p className="text-login-helper mt-1 text-xs/5">
                        {account.note}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyMockAccount(account)}
                      className="border-login-outline shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/5"
                    >
                      입력하기
                    </button>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-xs/5">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-login-helper">아이디</dt>
                      <dd className="font-mono text-white">
                        {account.loginId}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-login-helper">비밀번호</dt>
                      <dd className="font-mono text-white">
                        {account.password}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-login-helper">닉네임</dt>
                      <dd className="text-white">{account.nickname}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
