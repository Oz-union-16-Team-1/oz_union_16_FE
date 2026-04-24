import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import {
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
} from '../api/auth.error.handler';
import {
  useCheckIdDuplicateMutation,
  useCheckNicknameDuplicateMutation,
  useLoginMutation,
  useSignupMutation,
} from '../api/useAuthApi';
import type { AuthGender, SignupRequest } from '../types/auth';
import { resolveAuthFeedbackVisibility } from '../utils/feedbackPriority';
import { focusFieldByName, getFirstErrorFieldName } from '../utils/focusField';
import { hydrateAuthSessionFromAccessToken } from '../utils/sessionManager';

type SignupFormValues = Omit<SignupRequest, 'gender'> & {
  gender: AuthGender | '';
};

type SignupFieldName = keyof SignupFormValues;
type SignupFieldErrors = Partial<Record<SignupFieldName, string>>;
type SignupTouchedState = Record<SignupFieldName, boolean>;

type DuplicateCheckState = {
  verifiedValue: string | null;
  message: string;
  tone: 'success' | 'error' | null;
};

type DuplicateCheckToastState = {
  message: string;
  tone: 'success' | 'error';
  anchor: 'login_id' | 'nickname';
} | null;

export const SIGNUP_FORM_GENDER_OPTIONS = [
  { label: '남성', value: 'M' },
  { label: '여성', value: 'W' },
] as const;

export const SIGNUP_FORM_FIELD_MAX_LENGTHS = {
  name: 30,
  login_id: 15,
  nickname: 10,
} as const;

export const SIGNUP_FORM_GENDER_ID_PREFIX = 'signup-gender';

export const SIGNUP_FORM_FIELD_IDS: Record<SignupFieldName, string> = {
  name: 'signup-name',
  login_id: 'signup-id',
  nickname: 'signup-nickname',
  password: 'signup-password',
  password_check: 'signup-password-confirm',
  gender: `${SIGNUP_FORM_GENDER_ID_PREFIX}-M`,
};

const NICKNAME_WHITESPACE_MESSAGE = '닉네임에는 띄어쓰기를 사용할 수 없습니다.';

const initialDuplicateCheckState: DuplicateCheckState = {
  verifiedValue: null,
  message: '',
  tone: null,
};

const SIGNUP_FIELD_ORDER = [
  'name',
  'login_id',
  'nickname',
  'password',
  'password_check',
  'gender',
] as const satisfies readonly SignupFieldName[];

const getSignupFieldErrors = (
  values: SignupFormValues,
  touchedState: SignupTouchedState,
  loginIdVerified: boolean,
  nicknameVerified: boolean,
) => {
  const trimmedName = values.name.trim();
  const trimmedLoginId = values.login_id.trim();
  const trimmedNickname = values.nickname.trim();
  const trimmedPassword = values.password.trim();
  const trimmedPasswordCheck = values.password_check.trim();

  return {
    name: touchedState.name && !trimmedName ? '이름을 입력해주세요.' : '',
    login_id:
      touchedState.login_id && !trimmedLoginId
        ? '아이디를 입력해주세요.'
        : touchedState.login_id && trimmedLoginId && !loginIdVerified
          ? '아이디 중복확인을 해주세요.'
          : '',
    nickname:
      touchedState.nickname && !trimmedNickname
        ? '닉네임을 입력해주세요.'
        : touchedState.nickname && trimmedNickname && !nicknameVerified
          ? '닉네임 중복확인을 해주세요.'
          : '',
    password:
      touchedState.password && !trimmedPassword
        ? '비밀번호를 입력해주세요.'
        : touchedState.password &&
            trimmedPassword.length > 0 &&
            trimmedPassword.length < 8
          ? '비밀번호는 8자 이상이어야 합니다.'
          : '',
    password_check:
      touchedState.password_check && !trimmedPasswordCheck
        ? '비밀번호를 한번 더 입력해주세요.'
        : touchedState.password_check &&
            trimmedPassword.length > 0 &&
            trimmedPasswordCheck.length > 0 &&
            trimmedPassword !== trimmedPasswordCheck
          ? '비밀번호와 일치하지 않습니다.'
          : '',
    gender: touchedState.gender && !values.gender ? '성별을 선택해주세요.' : '',
  } satisfies Record<SignupFieldName, string>;
};

function useSignupForm() {
  const navigate = useNavigate();
  const signupMutation = useSignupMutation();
  const loginMutation = useLoginMutation();
  const checkIdDuplicateMutation = useCheckIdDuplicateMutation();
  const checkNicknameDuplicateMutation = useCheckNicknameDuplicateMutation();
  const [formValues, setFormValues] = useState<SignupFormValues>({
    name: '',
    login_id: '',
    nickname: '',
    password: '',
    password_check: '',
    gender: '',
  });
  const [touchedState, setTouchedState] = useState<SignupTouchedState>({
    name: false,
    login_id: false,
    nickname: false,
    password: false,
    password_check: false,
    gender: false,
  });
  const [apiFieldErrors, setApiFieldErrors] = useState<SignupFieldErrors>({});
  const [formMessage, setFormMessage] = useState('');
  const [nicknameWhitespaceMessage, setNicknameWhitespaceMessage] =
    useState('');
  const [loginIdCheckState, setLoginIdCheckState] =
    useState<DuplicateCheckState>(initialDuplicateCheckState);
  const [nicknameCheckState, setNicknameCheckState] =
    useState<DuplicateCheckState>(initialDuplicateCheckState);
  const [duplicateCheckToast, setDuplicateCheckToast] =
    useState<DuplicateCheckToastState>(null);

  const trimmedLoginId = formValues.login_id.trim();
  const trimmedNickname = formValues.nickname.trim();
  const trimmedPassword = formValues.password.trim();

  const isLoginIdVerified =
    loginIdCheckState.tone === 'success' &&
    loginIdCheckState.verifiedValue === trimmedLoginId;
  const isNicknameVerified =
    nicknameCheckState.tone === 'success' &&
    nicknameCheckState.verifiedValue === trimmedNickname;

  const localFieldErrors = getSignupFieldErrors(
    formValues,
    touchedState,
    isLoginIdVerified,
    isNicknameVerified,
  );

  const resolvedFieldErrors: Record<SignupFieldName, string> = {
    name: apiFieldErrors.name ?? localFieldErrors.name,
    login_id:
      apiFieldErrors.login_id ||
      (loginIdCheckState.tone === 'error' ? loginIdCheckState.message : '') ||
      localFieldErrors.login_id,
    nickname:
      apiFieldErrors.nickname ||
      nicknameWhitespaceMessage ||
      (nicknameCheckState.tone === 'error' ? nicknameCheckState.message : '') ||
      localFieldErrors.nickname,
    password: apiFieldErrors.password ?? localFieldErrors.password,
    password_check:
      apiFieldErrors.password_check ?? localFieldErrors.password_check,
    gender: apiFieldErrors.gender ?? localFieldErrors.gender,
  };
  const feedbackVisibility = resolveAuthFeedbackVisibility({
    fieldErrors: resolvedFieldErrors,
    formMessage,
    hasToast: Boolean(duplicateCheckToast),
  });
  const isSubmitting = signupMutation.isPending || loginMutation.isPending;
  const loginIdHelperMessage =
    !resolvedFieldErrors.login_id && loginIdCheckState.tone === 'success'
      ? loginIdCheckState.message
      : '';
  const nicknameHelperMessage =
    !resolvedFieldErrors.nickname && nicknameCheckState.tone === 'success'
      ? nicknameCheckState.message
      : '';
  const loginIdToast =
    feedbackVisibility.showToast && duplicateCheckToast?.anchor === 'login_id'
      ? duplicateCheckToast
      : null;
  const nicknameToast =
    feedbackVisibility.showToast && duplicateCheckToast?.anchor === 'nickname'
      ? duplicateCheckToast
      : null;

  useEffect(() => {
    if (!duplicateCheckToast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setDuplicateCheckToast(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [duplicateCheckToast]);

  const clearApiFieldError = (fieldName: SignupFieldName) => {
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

  const handleFieldChange = (fieldName: SignupFieldName, value: string) => {
    let nextValue = value;
    let nextNicknameHasWhitespace = false;

    if (fieldName === 'name') {
      nextValue = value.slice(0, SIGNUP_FORM_FIELD_MAX_LENGTHS.name);
    }

    if (fieldName === 'login_id') {
      nextValue = value.slice(0, SIGNUP_FORM_FIELD_MAX_LENGTHS.login_id);
    }

    if (fieldName === 'nickname') {
      nextNicknameHasWhitespace = /\s/.test(value);
      nextValue = value
        .replace(/\s+/g, '')
        .slice(0, SIGNUP_FORM_FIELD_MAX_LENGTHS.nickname);
      setNicknameWhitespaceMessage(
        nextNicknameHasWhitespace ? NICKNAME_WHITESPACE_MESSAGE : '',
      );
    }

    setFormValues((previous) => ({
      ...previous,
      [fieldName]: nextValue,
    }));

    clearApiFieldError(fieldName);
    setFormMessage('');

    if (fieldName === 'login_id') {
      setLoginIdCheckState((previous) =>
        previous.verifiedValue === nextValue.trim() &&
        previous.tone === 'success'
          ? previous
          : initialDuplicateCheckState,
      );
    }

    if (fieldName === 'nickname') {
      setNicknameCheckState((previous) =>
        previous.verifiedValue === nextValue.trim() &&
        previous.tone === 'success' &&
        !nextNicknameHasWhitespace
          ? previous
          : initialDuplicateCheckState,
      );
    }
  };

  const handleFieldBlur = (fieldName: SignupFieldName) => {
    setTouchedState((previous) => ({
      ...previous,
      [fieldName]: true,
    }));
  };

  const handleCheckLoginIdDuplicate = async () => {
    setTouchedState((previous) => ({
      ...previous,
      login_id: true,
    }));
    setFormMessage('');

    if (!trimmedLoginId) {
      focusFieldByName('login_id', SIGNUP_FORM_FIELD_IDS);
      return;
    }

    try {
      const response = await checkIdDuplicateMutation.mutateAsync({
        login_id: trimmedLoginId,
      });

      setLoginIdCheckState({
        verifiedValue: trimmedLoginId,
        message: response.detail,
        tone: 'success',
      });
      setDuplicateCheckToast({
        message: response.detail,
        tone: 'success',
        anchor: 'login_id',
      });
      clearApiFieldError('login_id');
    } catch (error) {
      const fieldErrors = extractAuthApiFieldErrors(error);
      const message = fieldErrors.login_id ?? extractAuthApiErrorMessage(error);

      setLoginIdCheckState({
        verifiedValue: null,
        message,
        tone: 'error',
      });
      setDuplicateCheckToast({
        message,
        tone: 'error',
        anchor: 'login_id',
      });
    }
  };

  const handleCheckNicknameDuplicate = async () => {
    setTouchedState((previous) => ({
      ...previous,
      nickname: true,
    }));
    setFormMessage('');

    if (!trimmedNickname) {
      focusFieldByName('nickname', SIGNUP_FORM_FIELD_IDS);
      return;
    }

    try {
      const response = await checkNicknameDuplicateMutation.mutateAsync({
        nickname: trimmedNickname,
      });

      setNicknameCheckState({
        verifiedValue: trimmedNickname,
        message: response.detail,
        tone: 'success',
      });
      setDuplicateCheckToast({
        message: response.detail,
        tone: 'success',
        anchor: 'nickname',
      });
      clearApiFieldError('nickname');
    } catch (error) {
      const fieldErrors = extractAuthApiFieldErrors(error);
      const message = fieldErrors.nickname ?? extractAuthApiErrorMessage(error);

      setNicknameCheckState({
        verifiedValue: null,
        message,
        tone: 'error',
      });
      setDuplicateCheckToast({
        message,
        tone: 'error',
        anchor: 'nickname',
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTouchedState = {
      name: true,
      login_id: true,
      nickname: true,
      password: true,
      password_check: true,
      gender: true,
    } satisfies SignupTouchedState;

    setTouchedState(nextTouchedState);
    setApiFieldErrors({});
    setFormMessage('');

    const nextFieldErrors = getSignupFieldErrors(
      formValues,
      nextTouchedState,
      isLoginIdVerified,
      isNicknameVerified,
    );
    const hasLocalError = Object.values(nextFieldErrors).some(Boolean);

    if (hasLocalError || !formValues.gender) {
      const firstInvalidField = getFirstErrorFieldName(
        nextFieldErrors,
        SIGNUP_FIELD_ORDER,
      );

      focusFieldByName(firstInvalidField, SIGNUP_FORM_FIELD_IDS);
      return;
    }

    const payload: SignupRequest = {
      name: formValues.name.trim(),
      login_id: trimmedLoginId,
      nickname: trimmedNickname,
      password: trimmedPassword,
      password_check: formValues.password_check.trim(),
      gender: formValues.gender,
    };

    try {
      await signupMutation.mutateAsync(payload);
    } catch (error) {
      const nextApiFieldErrors = extractAuthApiFieldErrors(error);
      const nextMessage = extractAuthApiErrorMessage(error);
      let focusTargetField = getFirstErrorFieldName(
        nextApiFieldErrors as Partial<Record<SignupFieldName, string>>,
        SIGNUP_FIELD_ORDER,
      );

      if (Object.keys(nextApiFieldErrors).length > 0) {
        setApiFieldErrors(nextApiFieldErrors);
      } else if (nextMessage.includes('닉네임')) {
        setApiFieldErrors((previous) => ({
          ...previous,
          nickname: nextMessage,
        }));
        focusTargetField = 'nickname';
      } else if (
        nextMessage.includes('아이디') ||
        nextMessage.includes('회원가입')
      ) {
        setApiFieldErrors((previous) => ({
          ...previous,
          login_id: nextMessage,
        }));
        focusTargetField = 'login_id';
      } else {
        setFormMessage(nextMessage);
      }

      focusFieldByName(focusTargetField, SIGNUP_FORM_FIELD_IDS);
      return;
    }

    try {
      const loginResponse = await loginMutation.mutateAsync({
        login_id: payload.login_id,
        password: payload.password,
      });

      await hydrateAuthSessionFromAccessToken(loginResponse.access_token);
      navigate(ROUTES.HOME);
    } catch {
      navigate(`/${ROUTES.LOGIN}`, {
        replace: true,
        state: {
          noticeMessage:
            '회원가입이 완료되었습니다. 로그인 후 서비스를 이용해 주세요.',
        },
      });
    }
  };

  return {
    formValues,
    resolvedFieldErrors,
    formMessage,
    showFormMessage: feedbackVisibility.showFormMessage,
    isSubmitting,
    isCheckingLoginIdDuplicate: checkIdDuplicateMutation.isPending,
    isCheckingNicknameDuplicate: checkNicknameDuplicateMutation.isPending,
    isLoginIdVerified,
    isNicknameVerified,
    loginIdHelperMessage,
    nicknameHelperMessage,
    loginIdToast,
    nicknameToast,
    handleFieldChange,
    handleFieldBlur,
    handleCheckLoginIdDuplicate,
    handleCheckNicknameDuplicate,
    handleSubmit,
    closeDuplicateCheckToast: () => setDuplicateCheckToast(null),
  };
}

export default useSignupForm;
