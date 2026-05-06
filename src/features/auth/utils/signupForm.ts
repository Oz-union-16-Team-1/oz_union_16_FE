import type { AuthGender, SignupRequest } from '../types/auth';

export type SignupFormValues = Omit<SignupRequest, 'gender'> & {
  gender: AuthGender | '';
};

export type SignupFieldName = keyof SignupFormValues;
export type SignupFieldErrors = Partial<Record<SignupFieldName, string>>;
export type SignupTouchedState = Record<SignupFieldName, boolean>;

export type DuplicateCheckState = {
  verifiedValue: string | null;
  message: string;
  tone: 'success' | 'error' | null;
};

export type DuplicateCheckToastState = {
  message: string;
  tone: 'success' | 'error';
  anchor: 'login_id' | 'nickname';
} | null;

export const SIGNUP_FORM_GENDER_OPTIONS = [
  { label: '남성', value: 'M' },
  { label: '여성', value: 'W' },
] as const satisfies readonly { label: string; value: AuthGender }[];

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

export const NICKNAME_WHITESPACE_MESSAGE =
  '닉네임에는 띄어쓰기를 사용할 수 없습니다.';

export const initialSignupFormValues: SignupFormValues = {
  name: '',
  login_id: '',
  nickname: '',
  password: '',
  password_check: '',
  gender: '',
};

export const initialSignupTouchedState: SignupTouchedState = {
  name: false,
  login_id: false,
  nickname: false,
  password: false,
  password_check: false,
  gender: false,
};

export const touchedAllSignupFields: SignupTouchedState = {
  name: true,
  login_id: true,
  nickname: true,
  password: true,
  password_check: true,
  gender: true,
};

export const initialDuplicateCheckState: DuplicateCheckState = {
  verifiedValue: null,
  message: '',
  tone: null,
};

export const SIGNUP_FIELD_ORDER = [
  'name',
  'login_id',
  'nickname',
  'password',
  'password_check',
  'gender',
] as const satisfies readonly SignupFieldName[];

export const getSignupFieldErrors = (
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
