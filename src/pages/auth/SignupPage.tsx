import AuthButton from '../../components/auth/AuthButton';
import AuthFormMessage from '../../components/auth/AuthFormMessage';
import AuthInputField from '../../components/auth/AuthInputField';
import ToastMessage from '../../components/mypage/ToastMessage';
import AuthInputActionButton from './components/AuthInputActionButton';
import AuthRadioGroup from './components/AuthRadioGroup';
import {
  AUTH_SHARED_FORM_CLASS_NAMES,
  AUTH_SHARED_LAYOUT_CLASS_NAMES,
} from './components/authSharedStyles';
import AuthLayout from './components/AuthLayout';
import useSignupForm, {
  SIGNUP_FORM_FIELD_IDS,
  SIGNUP_FORM_FIELD_MAX_LENGTHS,
  SIGNUP_FORM_GENDER_ID_PREFIX,
  SIGNUP_FORM_GENDER_OPTIONS,
} from './hooks/useSignupForm';

function SignupPage() {
  const {
    formValues,
    resolvedFieldErrors,
    formMessage,
    showFormMessage,
    isSubmitting,
    isCheckingLoginIdDuplicate,
    isCheckingNicknameDuplicate,
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
    closeDuplicateCheckToast,
  } = useSignupForm();
  const duplicateCheckToast = loginIdToast ?? nicknameToast;

  return (
    <>
      {duplicateCheckToast ? (
        <ToastMessage
          message={duplicateCheckToast.message}
          tone={duplicateCheckToast.tone}
          onClose={closeDuplicateCheckToast}
          variant="fixedTopCenter"
        />
      ) : null}

      <AuthLayout
        title="회원가입"
        titleClassName="text-[clamp(1.68rem,4vw,2.45rem)]"
        withPanel
        panelClassName={AUTH_SHARED_LAYOUT_CLASS_NAMES.panel}
        contentClassName={AUTH_SHARED_LAYOUT_CLASS_NAMES.content}
      >
        <form
          className={`${AUTH_SHARED_FORM_CLASS_NAMES.form} mt-5 sm:mt-6`}
          autoComplete="on"
          onSubmit={handleSubmit}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden opacity-0"
          >
            <input type="text" tabIndex={-1} autoComplete="username" />
            <input type="password" tabIndex={-1} autoComplete="new-password" />
          </div>

          <AuthInputField
            id={SIGNUP_FORM_FIELD_IDS.name}
            name="name"
            label="이름"
            type="text"
            autoComplete="name"
            placeholder="이름을 입력하세요"
            maxLength={SIGNUP_FORM_FIELD_MAX_LENGTHS.name}
            value={formValues.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            onBlur={() => handleFieldBlur('name')}
            errorMessage={resolvedFieldErrors.name}
            disabled={isSubmitting}
          />

          <AuthInputField
            id={SIGNUP_FORM_FIELD_IDS.login_id}
            name="login_id"
            label="아이디"
            type="text"
            autoComplete="username"
            placeholder="아이디를 입력하세요"
            maxLength={SIGNUP_FORM_FIELD_MAX_LENGTHS.login_id}
            value={formValues.login_id}
            onChange={(event) =>
              handleFieldChange('login_id', event.target.value)
            }
            onBlur={() => handleFieldBlur('login_id')}
            errorMessage={resolvedFieldErrors.login_id}
            helperMessage={loginIdHelperMessage}
            helperMessageTone="success"
            disabled={isSubmitting}
            action={
              <AuthInputActionButton
                onClick={handleCheckLoginIdDuplicate}
                disabled={
                  isCheckingLoginIdDuplicate ||
                  isSubmitting ||
                  isLoginIdVerified
                }
              >
                {isCheckingLoginIdDuplicate
                  ? '확인 중...'
                  : isLoginIdVerified
                    ? '확인완료'
                    : '중복확인'}
              </AuthInputActionButton>
            }
          />

          <AuthInputField
            id={SIGNUP_FORM_FIELD_IDS.nickname}
            name="nickname"
            label="닉네임"
            type="text"
            autoComplete="nickname"
            placeholder="닉네임을 입력하세요"
            maxLength={SIGNUP_FORM_FIELD_MAX_LENGTHS.nickname}
            value={formValues.nickname}
            onChange={(event) =>
              handleFieldChange('nickname', event.target.value)
            }
            onBlur={() => handleFieldBlur('nickname')}
            errorMessage={resolvedFieldErrors.nickname}
            helperMessage={nicknameHelperMessage}
            helperMessageTone="success"
            disabled={isSubmitting}
            action={
              <AuthInputActionButton
                onClick={handleCheckNicknameDuplicate}
                disabled={
                  isCheckingNicknameDuplicate ||
                  isSubmitting ||
                  isNicknameVerified
                }
              >
                {isCheckingNicknameDuplicate
                  ? '확인 중...'
                  : isNicknameVerified
                    ? '확인완료'
                    : '중복확인'}
              </AuthInputActionButton>
            }
          />

          <AuthInputField
            id={SIGNUP_FORM_FIELD_IDS.password}
            name="password"
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 입력하세요"
            value={formValues.password}
            onChange={(event) =>
              handleFieldChange('password', event.target.value)
            }
            onBlur={() => handleFieldBlur('password')}
            errorMessage={resolvedFieldErrors.password}
            disabled={isSubmitting}
          />

          <AuthInputField
            id={SIGNUP_FORM_FIELD_IDS.password_check}
            name="password_check"
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 한번 더 입력하세요"
            value={formValues.password_check}
            onChange={(event) =>
              handleFieldChange('password_check', event.target.value)
            }
            onBlur={() => handleFieldBlur('password_check')}
            errorMessage={resolvedFieldErrors.password_check}
            disabled={isSubmitting}
          />

          <AuthRadioGroup
            label="성별"
            name="gender"
            idPrefix={SIGNUP_FORM_GENDER_ID_PREFIX}
            value={formValues.gender}
            options={SIGNUP_FORM_GENDER_OPTIONS}
            onChange={(event) =>
              handleFieldChange('gender', event.target.value)
            }
            errorMessage={resolvedFieldErrors.gender}
            disabled={isSubmitting}
          />

          {showFormMessage ? (
            <AuthFormMessage
              className={AUTH_SHARED_FORM_CLASS_NAMES.feedbackMessage}
            >
              {formMessage}
            </AuthFormMessage>
          ) : null}

          <AuthButton
            type="submit"
            className={AUTH_SHARED_FORM_CLASS_NAMES.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? '회원가입 중...' : '회원가입'}
          </AuthButton>
        </form>
      </AuthLayout>
    </>
  );
}

export default SignupPage;
