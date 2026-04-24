import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { api } from '../../../api/axios';
import { ROUTES } from '../../../constants/routes';
import { mockServiceWorkerEnabled } from '../../../lib/env';
import { resolveLoginApiError } from '../api/auth';
import { useLoginMutation } from '../api/useAuthApi';
import { AUTH_SESSION_EXPIRED_NOTICE_MESSAGE } from '../constants/session';
import type { LoginRequest } from '../types/auth';
import { resolveAuthFeedbackVisibility } from '../utils/feedbackPriority';
import { focusFieldByName } from '../utils/focusField';
import { hydrateAuthSessionFromAccessToken } from '../utils/sessionManager';
import { getSocialCallbackErrorMessage } from '../utils/socialAuth';

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

type DevMockLoginAccountsResponse = {
  accounts: DevMockLoginAccount[];
};

export const LOGIN_FORM_FIELD_IDS: Record<LoginFieldName, string> = {
  login_id: 'login-id',
  password: 'login-password',
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

const resolveMockAccounts = (
  accounts: DevMockLoginAccountsResponse['accounts'] | undefined,
) => (Array.isArray(accounts) ? accounts : []);

function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const [mockAccounts, setMockAccounts] = useState<DevMockLoginAccount[]>([]);
  const [isMockPanelOpen, setIsMockPanelOpen] = useState(false);
  const mockPanelRef = useRef<HTMLDivElement | null>(null);

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
  const locationSearchParams = new URLSearchParams(location.search);
  const locationSearchErrorMessage =
    getSocialCallbackErrorMessage(locationSearchParams);
  const locationSearchNoticeMessage =
    locationSearchParams.get('expired') === 'true'
      ? AUTH_SESSION_EXPIRED_NOTICE_MESSAGE
      : '';
  const [formMessage, setFormMessage] = useState(
    locationState?.errorMessage ?? locationSearchErrorMessage ?? '',
  );
  const [noticeMessage, setNoticeMessage] = useState(
    locationState?.noticeMessage ?? locationSearchNoticeMessage,
  );
  const fieldErrors = getLoginFieldErrors(formValues, touchedState);
  const resolvedFieldErrors: Record<LoginFieldName, string> = {
    login_id: apiFieldErrors.login_id ?? fieldErrors.login_id,
    password: apiFieldErrors.password ?? fieldErrors.password,
  };
  const feedbackVisibility = resolveAuthFeedbackVisibility({
    fieldErrors: resolvedFieldErrors,
    formMessage,
  });
  const showNoticeMessage =
    !feedbackVisibility.hasFieldError &&
    !feedbackVisibility.showFormMessage &&
    Boolean(noticeMessage.trim());
  const primaryMockAccount =
    mockAccounts.find((account) => account.loginId === 'pgti-demo') ??
    mockAccounts[0];
  const visibleMockAccounts = primaryMockAccount ? [primaryMockAccount] : [];
  const showMockAccounts =
    mockServiceWorkerEnabled && visibleMockAccounts.length > 0;

  useEffect(() => {
    setFormMessage(
      locationState?.errorMessage ?? locationSearchErrorMessage ?? '',
    );
  }, [locationState?.errorMessage, locationSearchErrorMessage]);

  useEffect(() => {
    setNoticeMessage(
      locationState?.noticeMessage ?? locationSearchNoticeMessage,
    );
  }, [locationState?.noticeMessage, locationSearchNoticeMessage]);

  useEffect(() => {
    if (!mockServiceWorkerEnabled) {
      return;
    }

    let isMounted = true;

    void api
      .get<DevMockLoginAccountsResponse>('/api/v1/accounts/dev-login-accounts')
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        setMockAccounts(resolveMockAccounts(data?.accounts));
      })
      .catch(async () => {
        try {
          const { mockLoginAccounts } = await import('../mocks/mockUsers');

          if (!isMounted) {
            return;
          }

          setMockAccounts(mockLoginAccounts);
        } catch {
          if (!isMounted) {
            return;
          }

          setMockAccounts([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (showMockAccounts) {
      return;
    }

    setIsMockPanelOpen(false);
  }, [showMockAccounts]);

  useEffect(() => {
    if (!isMockPanelOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMockPanelOpen(false);
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        mockPanelRef.current &&
        !mockPanelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('.dev-login-fab')
      ) {
        setIsMockPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMockPanelOpen]);

  const clearApiFieldError = (fieldName: LoginFieldName) => {
    setApiFieldErrors((previous) => {
      if (!previous[fieldName]) {
        return previous;
      }

      return {
        ...previous,
        [fieldName]: '',
      };
    });
  };

  const clearMessages = () => {
    setFormMessage('');
    setNoticeMessage('');
  };

  const handleChange = (fieldName: LoginFieldName, value: string) => {
    setFormValues((previous) => ({
      ...previous,
      [fieldName]: value,
    }));
    clearApiFieldError(fieldName);
    clearMessages();
  };

  const handleBlur = (fieldName: LoginFieldName) => {
    setTouchedState((previous) => ({
      ...previous,
      [fieldName]: true,
    }));
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
    clearMessages();
    setIsMockPanelOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTouchedState = {
      login_id: true,
      password: true,
    } satisfies LoginTouchedState;

    setTouchedState(nextTouchedState);
    setApiFieldErrors({});
    clearMessages();

    const nextFieldErrors = getLoginFieldErrors(formValues, nextTouchedState);
    const hasLocalError = Object.values(nextFieldErrors).some(Boolean);

    if (hasLocalError) {
      const firstInvalidField: LoginFieldName | null = nextFieldErrors.login_id
        ? 'login_id'
        : nextFieldErrors.password
          ? 'password'
          : null;

      focusFieldByName(firstInvalidField, LOGIN_FORM_FIELD_IDS);
      return;
    }

    const payload: LoginRequest = {
      login_id: formValues.login_id.trim(),
      password: formValues.password.trim(),
    };

    let accessToken: string;

    try {
      const response = await loginMutation.mutateAsync(payload);
      accessToken = response.access_token;
    } catch (error) {
      const resolvedError = resolveLoginApiError(error, payload);

      setApiFieldErrors(resolvedError.fieldErrors);
      setFormMessage(resolvedError.message);
      focusFieldByName(resolvedError.focusField, LOGIN_FORM_FIELD_IDS);
      return;
    }

    try {
      await hydrateAuthSessionFromAccessToken(accessToken);
      navigate(ROUTES.HOME);
    } catch {
      setFormMessage(
        '로그인 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return {
    formValues,
    resolvedFieldErrors,
    formMessage,
    noticeMessage,
    showNoticeMessage,
    showFormMessage: feedbackVisibility.showFormMessage,
    isSubmitting: loginMutation.isPending,
    visibleMockAccounts,
    showMockAccounts,
    isMockPanelOpen,
    mockPanelRef,
    handleChange,
    handleBlur,
    handleSubmit,
    handleApplyMockAccount,
    closeMockPanel: () => setIsMockPanelOpen(false),
    toggleMockPanel: () => setIsMockPanelOpen((previous) => !previous),
  };
}

export default useLoginForm;
