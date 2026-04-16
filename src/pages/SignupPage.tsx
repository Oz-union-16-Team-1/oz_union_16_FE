import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import AuthButton from '../components/auth/AuthButton';
import AuthDivider from '../components/auth/AuthDivider';
import AuthFormMessage from '../components/auth/AuthFormMessage';
import AuthInputActionButton from '../components/auth/AuthInputActionButton';
import AuthInputField from '../components/auth/AuthInputField';
import AuthRadioGroup from '../components/auth/AuthRadioGroup';
import AuthSocialLoginGroup from '../components/auth/AuthSocialLoginGroup';
import AuthLayout from '../components/layout/AuthLayout';
import { ROUTES } from '../constants/routes';
import {
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
} from '../features/auth/api/auth';
import {
  useCheckIdDuplicateMutation,
  useCheckNicknameDuplicateMutation,
  useLoginMutation,
  useSignupMutation,
} from '../features/auth/api/useAuthApi';
import type { AuthGender, SignupRequest } from '../features/auth/types/auth';
import { setAuthTokens } from '../utils/auth';

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

const signupGenderOptions = [
  { label: '남성', value: 'M' },
  { label: '여성', value: 'W' },
] as const;

const initialDuplicateCheckState: DuplicateCheckState = {
  verifiedValue: null,
  message: '',
  tone: null,
};

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
            trimmedPassword.length <= 8
          ? '비밀번호가 8자 이하입니다.'
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

function SignupPage() {
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
  const [loginIdCheckState, setLoginIdCheckState] =
    useState<DuplicateCheckState>(initialDuplicateCheckState);
  const [nicknameCheckState, setNicknameCheckState] =
    useState<DuplicateCheckState>(initialDuplicateCheckState);

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
      (nicknameCheckState.tone === 'error' ? nicknameCheckState.message : '') ||
      localFieldErrors.nickname,
    password: apiFieldErrors.password ?? localFieldErrors.password,
    password_check:
      apiFieldErrors.password_check ?? localFieldErrors.password_check,
    gender: apiFieldErrors.gender ?? localFieldErrors.gender,
  };

  const isSubmitting = signupMutation.isPending || loginMutation.isPending;

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
    setFormValues((previous) => ({
      ...previous,
      [fieldName]: value,
    }));

    clearApiFieldError(fieldName);
    setFormMessage('');

    if (fieldName === 'login_id') {
      setLoginIdCheckState((previous) =>
        previous.verifiedValue === value.trim() && previous.tone === 'success'
          ? previous
          : initialDuplicateCheckState,
      );
    }

    if (fieldName === 'nickname') {
      setNicknameCheckState((previous) =>
        previous.verifiedValue === value.trim() && previous.tone === 'success'
          ? previous
          : initialDuplicateCheckState,
      );
    }
  };

  const handleCheckLoginIdDuplicate = async () => {
    setTouchedState((previous) => ({
      ...previous,
      login_id: true,
    }));
    setFormMessage('');

    if (!trimmedLoginId) {
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
      clearApiFieldError('login_id');
    } catch (error) {
      const fieldErrors = extractAuthApiFieldErrors(error);
      const message = fieldErrors.login_id ?? extractAuthApiErrorMessage(error);

      setLoginIdCheckState({
        verifiedValue: null,
        message,
        tone: 'error',
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
      clearApiFieldError('nickname');
    } catch (error) {
      const fieldErrors = extractAuthApiFieldErrors(error);
      const message = fieldErrors.nickname ?? extractAuthApiErrorMessage(error);

      setNicknameCheckState({
        verifiedValue: null,
        message,
        tone: 'error',
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

      if (Object.keys(nextApiFieldErrors).length > 0) {
        setApiFieldErrors(nextApiFieldErrors);
      } else if (nextMessage.includes('닉네임')) {
        setApiFieldErrors((previous) => ({
          ...previous,
          nickname: nextMessage,
        }));
      } else if (
        nextMessage.includes('아이디') ||
        nextMessage.includes('회원가입')
      ) {
        setApiFieldErrors((previous) => ({
          ...previous,
          login_id: nextMessage,
        }));
      } else {
        setFormMessage(nextMessage);
      }

      return;
    }

    try {
      const loginResponse = await loginMutation.mutateAsync({
        login_id: payload.login_id,
        password: payload.password,
      });

      setAuthTokens(loginResponse.access_token, loginResponse.refresh_token);
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

  return (
    <AuthLayout
      title="Join"
      subtitle="회원가입 후 취향 기반 게임 추천을 시작해보세요"
      withPanel
      subtitleClassName="mx-auto max-w-[290px] sm:max-w-[320px]"
    >
      <AuthSocialLoginGroup className="mt-6 sm:mt-7" />

      <AuthDivider className="my-5 sm:my-6" />

      <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit}>
        <AuthInputField
          id="signup-name"
          name="name"
          label="이름"
          type="text"
          autoComplete="name"
          placeholder="이름을 입력하세요"
          value={formValues.name}
          onChange={(event) => handleFieldChange('name', event.target.value)}
          onBlur={() =>
            setTouchedState((previous) => ({
              ...previous,
              name: true,
            }))
          }
          errorMessage={resolvedFieldErrors.name}
          disabled={isSubmitting}
          containerClassName="pt-1"
        />

        <AuthInputField
          id="signup-id"
          name="login_id"
          label="아이디"
          type="text"
          autoComplete="username"
          placeholder="아이디를 입력하세요"
          value={formValues.login_id}
          onChange={(event) =>
            handleFieldChange('login_id', event.target.value)
          }
          onBlur={() =>
            setTouchedState((previous) => ({
              ...previous,
              login_id: true,
            }))
          }
          errorMessage={resolvedFieldErrors.login_id}
          helperMessage={
            !resolvedFieldErrors.login_id &&
            loginIdCheckState.tone === 'success'
              ? loginIdCheckState.message
              : ''
          }
          helperMessageTone="success"
          disabled={isSubmitting}
          action={
            <AuthInputActionButton
              onClick={handleCheckLoginIdDuplicate}
              disabled={
                checkIdDuplicateMutation.isPending ||
                isSubmitting ||
                isLoginIdVerified
              }
            >
              {checkIdDuplicateMutation.isPending
                ? '확인 중...'
                : isLoginIdVerified
                  ? '확인완료'
                  : '중복확인'}
            </AuthInputActionButton>
          }
        />

        <AuthInputField
          id="signup-nickname"
          name="nickname"
          label="닉네임"
          type="text"
          autoComplete="nickname"
          placeholder="닉네임을 입력하세요"
          value={formValues.nickname}
          onChange={(event) =>
            handleFieldChange('nickname', event.target.value)
          }
          onBlur={() =>
            setTouchedState((previous) => ({
              ...previous,
              nickname: true,
            }))
          }
          errorMessage={resolvedFieldErrors.nickname}
          helperMessage={
            !resolvedFieldErrors.nickname &&
            nicknameCheckState.tone === 'success'
              ? nicknameCheckState.message
              : ''
          }
          helperMessageTone="success"
          disabled={isSubmitting}
          action={
            <AuthInputActionButton
              onClick={handleCheckNicknameDuplicate}
              disabled={
                checkNicknameDuplicateMutation.isPending ||
                isSubmitting ||
                isNicknameVerified
              }
            >
              {checkNicknameDuplicateMutation.isPending
                ? '확인 중...'
                : isNicknameVerified
                  ? '확인완료'
                  : '중복확인'}
            </AuthInputActionButton>
          }
        />

        <AuthInputField
          id="signup-password"
          name="password"
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
          value={formValues.password}
          onChange={(event) =>
            handleFieldChange('password', event.target.value)
          }
          onBlur={() =>
            setTouchedState((previous) => ({
              ...previous,
              password: true,
            }))
          }
          errorMessage={resolvedFieldErrors.password}
          disabled={isSubmitting}
        />

        <AuthInputField
          id="signup-password-confirm"
          name="password_check"
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 한번 더 입력하세요"
          value={formValues.password_check}
          onChange={(event) =>
            handleFieldChange('password_check', event.target.value)
          }
          onBlur={() =>
            setTouchedState((previous) => ({
              ...previous,
              password_check: true,
            }))
          }
          errorMessage={resolvedFieldErrors.password_check}
          disabled={isSubmitting}
        />

        <AuthRadioGroup
          label="성별"
          name="gender"
          value={formValues.gender}
          options={signupGenderOptions}
          onChange={(event) =>
            handleFieldChange('gender', event.target.value as AuthGender)
          }
          errorMessage={resolvedFieldErrors.gender}
          disabled={isSubmitting}
        />

        {formMessage ? <AuthFormMessage>{formMessage}</AuthFormMessage> : null}

        <AuthButton
          type="submit"
          className="mt-1 w-full sm:mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? '회원가입 중...' : '회원가입'}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}

export default SignupPage;
