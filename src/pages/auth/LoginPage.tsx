import { KeyRound, X } from 'lucide-react';

import AuthButton from '../../components/auth/AuthButton';
import AuthFormMessage from '../../components/auth/AuthFormMessage';
import AuthInputField from '../../components/auth/AuthInputField';
import MainPageLoadingFallback from '../../components/common/MainPageLoadingFallback';
import { ROUTES } from '../../constants/routes';
import AuthDivider from './components/AuthDivider';
import AuthLinkButton from './components/AuthLinkButton';
import AuthSocialLoginGroup from './components/AuthSocialLoginGroup';
import {
  AUTH_SHARED_FORM_CLASS_NAMES,
  AUTH_SHARED_LAYOUT_CLASS_NAMES,
} from './components/authSharedStyles';
import AuthLayout from './components/AuthLayout';
import useLoginForm, { LOGIN_FORM_FIELD_IDS } from './hooks/useLoginForm';

const LOGIN_MOCK_FAB_CLASS_NAME =
  'dev-floating-fab group relative flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none';
const LOGIN_DEV_FABS_CLASS_NAME =
  'fixed left-4 bottom-4 z-[95] flex items-center gap-3 sm:left-6 sm:bottom-6';
const LOGIN_MOCK_PANEL_CLASS_NAME =
  'support-chat-panel fixed left-4 bottom-22 z-[90] flex w-[min(92vw,22rem)] origin-bottom-left flex-col overflow-hidden transition-all duration-300 ease-out sm:left-6 sm:bottom-24';

function LoginPage() {
  const {
    formValues,
    resolvedFieldErrors,
    formMessage,
    noticeMessage,
    showNoticeMessage,
    showFormMessage,
    isLoginFlowLoading,
    isSubmitting,
    visibleMockAccounts,
    showMockAccounts,
    isMockPanelOpen,
    mockPanelRef,
    mockFabRef,
    handleChange,
    handleBlur,
    handleSubmit,
    handleApplyMockAccount,
    closeMockPanel,
    toggleMockPanel,
  } = useLoginForm();

  if (isLoginFlowLoading) {
    return <MainPageLoadingFallback />;
  }

  return (
    <>
      <AuthLayout
        title="로그인"
        titleClassName="text-[clamp(1.68rem,4vw,2.45rem)]"
        withPanel
        panelClassName={AUTH_SHARED_LAYOUT_CLASS_NAMES.panel}
        contentClassName={AUTH_SHARED_LAYOUT_CLASS_NAMES.content}
      >
        <AuthSocialLoginGroup
          className={AUTH_SHARED_FORM_CLASS_NAMES.socialGroup}
        />

        <AuthDivider className={AUTH_SHARED_FORM_CLASS_NAMES.divider} />

        <form
          className={AUTH_SHARED_FORM_CLASS_NAMES.form}
          onSubmit={handleSubmit}
        >
          <AuthInputField
            id={LOGIN_FORM_FIELD_IDS.login_id}
            name="login_id"
            label="아이디"
            type="text"
            autoComplete="username"
            placeholder="ID"
            value={formValues.login_id}
            onChange={(event) => handleChange('login_id', event.target.value)}
            onBlur={() => handleBlur('login_id')}
            errorMessage={resolvedFieldErrors.login_id}
            disabled={isSubmitting}
          />

          <AuthInputField
            id={LOGIN_FORM_FIELD_IDS.password}
            name="password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="PASSWORD"
            value={formValues.password}
            onChange={(event) => handleChange('password', event.target.value)}
            onBlur={() => handleBlur('password')}
            errorMessage={resolvedFieldErrors.password}
            disabled={isSubmitting}
          />

          {showNoticeMessage ? (
            <AuthFormMessage
              tone="success"
              className={AUTH_SHARED_FORM_CLASS_NAMES.feedbackMessage}
            >
              {noticeMessage}
            </AuthFormMessage>
          ) : null}

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
            {isSubmitting ? '로그인 중...' : '로그인'}
          </AuthButton>
        </form>

        <div className={AUTH_SHARED_FORM_CLASS_NAMES.footerSection}>
          <p className={AUTH_SHARED_FORM_CLASS_NAMES.footerHelperText}>
            아직 PGTI 회원이 아니신가요?
          </p>
          <AuthLinkButton
            to={`/${ROUTES.SIGNUP}`}
            className={AUTH_SHARED_FORM_CLASS_NAMES.footerLinkButton}
          >
            회원가입
          </AuthLinkButton>
        </div>
      </AuthLayout>

      {showMockAccounts ? (
        <>
          {isMockPanelOpen ? (
            <div
              ref={mockPanelRef}
              className={`${LOGIN_MOCK_PANEL_CLASS_NAME} pointer-events-auto translate-y-0 scale-100 opacity-100`}
              role="dialog"
              aria-modal="false"
              aria-label="개발용 로그인 계정"
            >
              <div className="flex w-full flex-col">
                <div className="border-login-outline flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      개발용 로그인 계정
                    </p>
                    <p className="text-login-helper mt-1 text-xs/5">
                      dev + MSW에서만 표시됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeMockPanel}
                    className="support-chat-icon-btn"
                    aria-label="개발용 로그인 계정 패널 닫기"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="support-chat-scrollbar max-h-[min(60vh,28rem)] overflow-y-auto px-4 py-4">
                  <ul className="space-y-2.5">
                    {visibleMockAccounts.map((account) => (
                      <li
                        key={account.loginId}
                        className="border-login-outline rounded-2xl border bg-black/20 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              {account.name}
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
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div className={LOGIN_DEV_FABS_CLASS_NAME}>
        {showMockAccounts ? (
          <button
            type="button"
            ref={mockFabRef}
            onClick={toggleMockPanel}
            className={LOGIN_MOCK_FAB_CLASS_NAME}
            aria-label={
              isMockPanelOpen
                ? '개발용 로그인 계정 패널 닫기'
                : '개발용 로그인 계정 패널 열기'
            }
          >
            <span className="dev-floating-fab-glow" />
            <KeyRound
              size={22}
              className={`relative z-10 transition-transform ${
                isMockPanelOpen ? 'scale-95 -rotate-6' : 'scale-100'
              }`}
            />
          </button>
        ) : null}
      </div>
    </>
  );
}

export default LoginPage;
