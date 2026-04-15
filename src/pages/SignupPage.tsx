import type { FormEvent } from 'react';
import { useState } from 'react';

import AuthButton from '../components/auth/AuthButton';
import AuthDivider from '../components/auth/AuthDivider';
import AuthInputField from '../components/auth/AuthInputField';
import AuthInputActionButton from '../components/auth/AuthInputActionButton';
import AuthRadioGroup from '../components/auth/AuthRadioGroup';
import AuthSocialLoginGroup from '../components/auth/AuthSocialLoginGroup';
import AuthLayout from '../components/layout/AuthLayout';
import type { AuthGender } from '../features/auth/types/auth';

const signupGenderOptions = [
  { label: '남성', value: 'M' },
  { label: '여성', value: 'W' },
] as const;

function SignupPage() {
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [gender, setGender] = useState<AuthGender | ''>('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordCheckTouched, setPasswordCheckTouched] = useState(false);
  const [genderTouched, setGenderTouched] = useState(false);

  const trimmedPassword = password.trim();
  const trimmedPasswordCheck = passwordCheck.trim();

  const passwordError =
    passwordTouched && trimmedPassword.length > 0 && trimmedPassword.length <= 8
      ? '비밀번호가 8자 이하입니다.'
      : '';

  const passwordCheckError =
    passwordCheckTouched &&
    trimmedPassword.length > 0 &&
    trimmedPasswordCheck.length > 0 &&
    trimmedPassword !== trimmedPasswordCheck
      ? '비밀번호와 일치하지 않습니다.'
      : '';

  const genderError = genderTouched && !gender ? '성별을 선택해주세요.' : '';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordTouched(true);
    setPasswordCheckTouched(true);
    setGenderTouched(true);
  };

  return (
    <AuthLayout
      title="Join"
      subtitle="회원가입 후 취향 기반 게임 추천을 시작해보세요"
      withPanel
      subtitleClassName="mx-auto max-w-[290px]"
    >
      <AuthSocialLoginGroup className="mt-7" />

      <AuthDivider label="OR" className="my-6" />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInputField
          id="signup-name"
          name="name"
          label="이름"
          type="text"
          autoComplete="name"
          placeholder="이름을 입력하세요"
          containerClassName="pt-1"
        />

        <AuthInputField
          id="signup-id"
          name="login_id"
          label="아이디"
          type="text"
          autoComplete="username"
          placeholder="아이디를 입력하세요"
          action={<AuthInputActionButton label="중복확인" />}
        />

        <AuthInputField
          id="signup-nickname"
          name="nickname"
          label="닉네임"
          type="text"
          autoComplete="nickname"
          placeholder="닉네임을 입력하세요"
          action={<AuthInputActionButton label="중복확인" />}
        />

        <AuthInputField
          id="signup-password"
          name="password"
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setPasswordTouched(true)}
          errorMessage={passwordError}
        />

        <AuthInputField
          id="signup-password-confirm"
          name="password_check"
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 한번 더 입력하세요"
          value={passwordCheck}
          onChange={(event) => setPasswordCheck(event.target.value)}
          onBlur={() => setPasswordCheckTouched(true)}
          errorMessage={passwordCheckError}
        />

        <AuthRadioGroup
          label="성별"
          name="gender"
          value={gender}
          options={signupGenderOptions}
          onChange={(event) => setGender(event.target.value as AuthGender)}
          errorMessage={genderError}
        />

        <AuthButton type="submit" className="mt-2 w-full">
          회원가입
        </AuthButton>
      </form>
    </AuthLayout>
  );
}

export default SignupPage;
