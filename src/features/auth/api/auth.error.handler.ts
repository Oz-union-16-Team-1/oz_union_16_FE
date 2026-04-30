import { AxiosError } from 'axios';

import type { ErrorResponseBody, LoginRequest } from '../types/auth';

const DEFAULT_API_ERROR_MESSAGE =
  '요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

type LoginFieldName = keyof LoginRequest;

export type LoginErrorStatusCode = 400 | 401 | 403;

export type LoginErrorPolicy = {
  fallbackMessage: string;
  defaultFocusField: LoginFieldName | null;
  hideFormMessageWhenFieldError: boolean;
  preferApiMessage: boolean;
};

export type ResolveLoginApiErrorResult = {
  statusCode: LoginErrorStatusCode | null;
  fieldErrors: Partial<Record<LoginFieldName, string>>;
  message: string;
  focusField: LoginFieldName | null;
};

export const LOGIN_ERROR_POLICIES: Record<
  LoginErrorStatusCode,
  LoginErrorPolicy
> = {
  400: {
    fallbackMessage: '아이디 또는 비밀번호를 입력해주세요.',
    defaultFocusField: null,
    hideFormMessageWhenFieldError: true,
    preferApiMessage: false,
  },
  401: {
    fallbackMessage: '아이디 또는 비밀번호가 올바르지 않습니다.',
    defaultFocusField: 'password',
    hideFormMessageWhenFieldError: false,
    preferApiMessage: true,
  },
  403: {
    fallbackMessage:
      '접근 권한이 없거나 이용이 제한된 계정입니다. 고객센터에 문의하세요.',
    defaultFocusField: null,
    hideFormMessageWhenFieldError: false,
    preferApiMessage: true,
  },
};

const extractFieldErrorMessage = (
  value?: string | Record<string, string[]>,
) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const [firstMessageGroup] = Object.values(value);

    if (typeof firstMessageGroup === 'string') {
      return firstMessageGroup;
    }

    if (Array.isArray(firstMessageGroup) && firstMessageGroup[0]) {
      return firstMessageGroup[0];
    }
  }

  return null;
};

const extractFieldErrors = (
  value?: string | Record<string, string[]>,
): Record<string, string> => {
  if (!value || typeof value === 'string') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([fieldName, messages]) => {
        if (typeof messages === 'string') {
          return [fieldName, messages];
        }

        if (Array.isArray(messages) && messages[0]) {
          return [fieldName, messages[0]];
        }

        return null;
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  );
};

export const extractAuthApiFieldErrors = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return {};
  }

  const data = error.response?.data as ErrorResponseBody | undefined;

  return {
    ...extractFieldErrors(data?.detail),
    ...extractFieldErrors(data?.error_detail),
  };
};

export const extractAuthApiErrorMessage = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return '요청을 처리하는 중 알 수 없는 오류가 발생했습니다.';
  }

  const data = error.response?.data as ErrorResponseBody | undefined;

  const detailMessage = extractFieldErrorMessage(data?.detail);

  if (detailMessage) {
    return detailMessage;
  }

  const errorDetailMessage = extractFieldErrorMessage(data?.error_detail);

  if (errorDetailMessage) {
    return errorDetailMessage;
  }

  return DEFAULT_API_ERROR_MESSAGE;
};

const getFirstLoginErrorField = (
  fieldErrors: Partial<Record<LoginFieldName, string>>,
  payload?: Partial<LoginRequest>,
) => {
  if (fieldErrors.login_id) {
    return 'login_id';
  }

  if (fieldErrors.password) {
    return 'password';
  }

  if (payload) {
    const loginId = payload.login_id?.trim() ?? '';
    const password = payload.password?.trim() ?? '';

    if (!loginId) {
      return 'login_id';
    }

    if (!password) {
      return 'password';
    }
  }

  return null;
};

const resolveLoginMessageByPolicy = ({
  policy,
  fieldErrors,
  apiMessage,
}: {
  policy: LoginErrorPolicy;
  fieldErrors: Partial<Record<LoginFieldName, string>>;
  apiMessage: string;
}) => {
  if (
    policy.hideFormMessageWhenFieldError &&
    getFirstLoginErrorField(fieldErrors)
  ) {
    return '';
  }

  if (policy.preferApiMessage && apiMessage !== DEFAULT_API_ERROR_MESSAGE) {
    return apiMessage;
  }

  return policy.fallbackMessage;
};

export const resolveLoginApiError = (
  error: unknown,
  payload?: Partial<LoginRequest>,
): ResolveLoginApiErrorResult => {
  const apiFieldErrors = extractAuthApiFieldErrors(error);
  const fieldErrors = {
    login_id: apiFieldErrors.login_id,
    password: apiFieldErrors.password,
  } satisfies Partial<Record<LoginFieldName, string>>;
  const focusField = getFirstLoginErrorField(fieldErrors, payload);

  if (!(error instanceof AxiosError)) {
    return {
      statusCode: null,
      fieldErrors,
      message: extractAuthApiErrorMessage(error),
      focusField,
    };
  }

  const statusCode = error.response?.status ?? null;
  const apiMessage = extractAuthApiErrorMessage(error);

  if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
    const policy = LOGIN_ERROR_POLICIES[statusCode];

    return {
      statusCode,
      fieldErrors,
      message: resolveLoginMessageByPolicy({
        policy,
        fieldErrors,
        apiMessage,
      }),
      focusField: focusField ?? policy.defaultFocusField,
    };
  }

  return {
    statusCode: null,
    fieldErrors,
    message: extractAuthApiErrorMessage(error),
    focusField,
  };
};

export const extractSuspendedAccountInfo = (error: unknown) => {
  if (!(error instanceof AxiosError) || error.response?.status !== 403) {
    return null;
  }

  const data = error.response.data as ErrorResponseBody | undefined;
  const errorMessage =
    extractFieldErrorMessage(data?.error_detail) ||
    extractFieldErrorMessage(data?.detail);

  if (errorMessage !== '정지된 계정입니다.') {
    return null;
  }

  return {
    message: errorMessage,
    suspendedAt:
      typeof data?.suspended_at === 'string' ? data.suspended_at : null,
  };
};
