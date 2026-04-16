import type { FormEvent } from 'react';
import { Heart, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';

import AuthButton from '../../components/auth/AuthButton';
import Header from '../../components/common/Header';
import ConfirmModal from '../../components/mypage/ConfirmModal';
import FavoriteGameCard from '../../components/mypage/FavoriteGameCard';
import FavoriteGamesEmptyState from '../../components/mypage/FavoriteGamesEmptyState';
import MyPageProfileSection from '../../components/mypage/MyPageProfileSection';
import PasswordChangePanel, {
  type PasswordChangeFieldName,
  type PasswordChangeValues,
} from '../../components/mypage/PasswordChangePanel';
import ToastMessage from '../../components/mypage/ToastMessage';
import { ROUTES } from '../../constants/routes';
import {
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
} from '../../features/auth/api/auth';
import {
  useChangePasswordMutation,
  useCurrentUserProfileQuery,
  useDeleteAccountMutation,
} from '../../features/auth/api/useAuthApi';
import useLogoutAction from '../../features/auth/hooks/useLogoutAction';
import { mockFavoriteGames } from '../../features/mypage/mockData';
import { clearAuthTokens, getAccessToken } from '../../utils/auth';

type PasswordTouchedState = Record<PasswordChangeFieldName, boolean>;
type PasswordFieldErrors = Partial<Record<PasswordChangeFieldName, string>>;
type ToastState = {
  tone: 'success' | 'error';
  message: string;
} | null;
type PasswordPanelMessage = {
  tone: 'success' | 'error';
  message: string;
} | null;

const initialPasswordValues: PasswordChangeValues = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
};

const initialTouchedState: PasswordTouchedState = {
  currentPassword: false,
  newPassword: false,
  newPasswordConfirm: false,
};

const getPasswordFieldErrors = (
  values: PasswordChangeValues,
  touchedState: PasswordTouchedState,
) => {
  const trimmedCurrentPassword = values.currentPassword.trim();
  const trimmedNewPassword = values.newPassword.trim();
  const trimmedNewPasswordConfirm = values.newPasswordConfirm.trim();

  return {
    currentPassword:
      touchedState.currentPassword && !trimmedCurrentPassword
        ? '현재 비밀번호를 입력해주세요.'
        : '',
    newPassword:
      touchedState.newPassword && !trimmedNewPassword
        ? '새 비밀번호를 입력해주세요.'
        : touchedState.newPassword &&
            trimmedNewPassword.length > 0 &&
            trimmedNewPassword.length <= 8
          ? '비밀번호가 8자 이하입니다.'
          : '',
    newPasswordConfirm:
      touchedState.newPasswordConfirm && !trimmedNewPasswordConfirm
        ? '새 비밀번호를 한번 더 입력해주세요.'
        : touchedState.newPasswordConfirm &&
            trimmedNewPassword.length > 0 &&
            trimmedNewPasswordConfirm.length > 0 &&
            trimmedNewPassword !== trimmedNewPasswordConfirm
          ? '비밀번호와 일치하지 않습니다.'
          : '',
  } satisfies Record<PasswordChangeFieldName, string>;
};

const mapPasswordApiFieldErrors = (
  fieldErrors: Record<string, string>,
): PasswordFieldErrors => ({
  currentPassword: fieldErrors.current_password,
  newPassword: fieldErrors.new_password,
  newPasswordConfirm: fieldErrors.new_password_confirm,
});

function MyPage() {
  const navigate = useNavigate();
  const hasAccessToken = Boolean(getAccessToken());
  const { logout, isPending: isLogoutPending } = useLogoutAction();
  const changePasswordMutation = useChangePasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const profileQuery = useCurrentUserProfileQuery(hasAccessToken);

  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);
  const [passwordValues, setPasswordValues] = useState<PasswordChangeValues>(
    initialPasswordValues,
  );
  const [touchedState, setTouchedState] =
    useState<PasswordTouchedState>(initialTouchedState);
  const [apiFieldErrors, setApiFieldErrors] = useState<PasswordFieldErrors>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [passwordPanelMessage, setPasswordPanelMessage] =
    useState<PasswordPanelMessage>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const localFieldErrors = useMemo(
    () => getPasswordFieldErrors(passwordValues, touchedState),
    [passwordValues, touchedState],
  );

  const resolvedFieldErrors: Record<PasswordChangeFieldName, string> = {
    currentPassword:
      apiFieldErrors.currentPassword ?? localFieldErrors.currentPassword,
    newPassword: apiFieldErrors.newPassword ?? localFieldErrors.newPassword,
    newPasswordConfirm:
      apiFieldErrors.newPasswordConfirm ?? localFieldErrors.newPasswordConfirm,
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  useEffect(() => {
    if (!isPasswordPanelOpen || passwordPanelMessage?.tone !== 'success') {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setIsPasswordPanelOpen(false);
      setPasswordValues(initialPasswordValues);
      setTouchedState(initialTouchedState);
      setApiFieldErrors({});
      setPasswordPanelMessage(null);
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isPasswordPanelOpen, passwordPanelMessage]);

  if (!hasAccessToken) {
    return (
      <Navigate
        to={`/${ROUTES.LOGIN}`}
        replace
        state={{ noticeMessage: '로그인 후 마이페이지를 이용할 수 있습니다.' }}
      />
    );
  }

  const favoriteCount = mockFavoriteGames.length;

  const resetPasswordPanel = () => {
    setPasswordValues(initialPasswordValues);
    setTouchedState(initialTouchedState);
    setApiFieldErrors({});
    setPasswordPanelMessage(null);
  };

  const closePasswordPanel = () => {
    setIsPasswordPanelOpen(false);
    resetPasswordPanel();
  };

  const handlePasswordValueChange = (
    fieldName: PasswordChangeFieldName,
    value: string,
  ) => {
    setPasswordValues((previous) => ({
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

    setPasswordPanelMessage(null);
  };

  const handlePasswordBlur = (fieldName: PasswordChangeFieldName) => {
    setTouchedState((previous) => ({
      ...previous,
      [fieldName]: true,
    }));
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTouchedState = {
      currentPassword: true,
      newPassword: true,
      newPasswordConfirm: true,
    } satisfies PasswordTouchedState;

    setTouchedState(nextTouchedState);
    setApiFieldErrors({});
    setPasswordPanelMessage(null);

    const nextFieldErrors = getPasswordFieldErrors(
      passwordValues,
      nextTouchedState,
    );
    const hasLocalError = Object.values(nextFieldErrors).some(Boolean);

    if (hasLocalError) {
      return;
    }

    try {
      const response = await changePasswordMutation.mutateAsync({
        current_password: passwordValues.currentPassword.trim(),
        new_password: passwordValues.newPassword.trim(),
        new_password_confirm: passwordValues.newPasswordConfirm.trim(),
      });

      setPasswordValues(initialPasswordValues);
      setTouchedState(initialTouchedState);
      setApiFieldErrors({});
      setPasswordPanelMessage({
        tone: 'success',
        message: response.detail,
      });
    } catch (error) {
      const nextApiFieldErrors = mapPasswordApiFieldErrors(
        extractAuthApiFieldErrors(error),
      );

      if (Object.values(nextApiFieldErrors).some(Boolean)) {
        setApiFieldErrors(nextApiFieldErrors);
        return;
      }

      setPasswordPanelMessage({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await deleteAccountMutation.mutateAsync();

      clearAuthTokens();
      navigate(`/${ROUTES.LOGIN}`, {
        replace: true,
        state: {
          noticeMessage: response.detail,
        },
      });
    } catch (error) {
      setToast({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-70" />
      <Header fixed isLoggedIn />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-[clamp(1rem,5vw,20rem)] pt-24 pb-14 sm:pt-28 sm:pb-16 lg:pt-32">
        <MyPageProfileSection
          nickname={profileQuery.data?.nickname ?? '회원'}
          isProfileLoading={profileQuery.isLoading}
          isLoggingOut={isLogoutPending}
          isPasswordPanelOpen={isPasswordPanelOpen}
          onPasswordToggle={() => setIsPasswordPanelOpen((current) => !current)}
          onLogout={() => {
            void logout();
          }}
        >
          {isPasswordPanelOpen ? (
            <PasswordChangePanel
              values={passwordValues}
              errors={resolvedFieldErrors}
              message={passwordPanelMessage?.message}
              messageTone={passwordPanelMessage?.tone ?? 'error'}
              isPending={changePasswordMutation.isPending}
              onValueChange={handlePasswordValueChange}
              onFieldBlur={handlePasswordBlur}
              onCancel={closePasswordPanel}
              onSubmit={handlePasswordSubmit}
            />
          ) : null}
        </MyPageProfileSection>

        <section className="bg-mypage-panel border-mypage-panel shadow-mypage-float mt-8 rounded-[28px] border px-4 py-5 backdrop-blur-xl sm:mt-10 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-mypage-accent-soft text-login-primary inline-flex h-11 w-11 items-center justify-center rounded-full">
                <Heart size={18} fill="currentColor" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-white">찜한 목록</h2>
                <p className="text-mypage-muted mt-1 text-sm/6">
                  내가 저장한 게임들을 한눈에 다시 확인할 수 있어요.
                </p>
              </div>
            </div>
            <p className="text-mypage-muted text-sm">
              {favoriteCount > 0
                ? `총 ${favoriteCount}개의 게임이 저장되어 있어요`
                : '아직 저장된 게임이 없어요'}
            </p>
          </div>

          <div className="mypage-scrollbar mt-5 max-h-[720px] overflow-y-auto pr-1">
            {favoriteCount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {mockFavoriteGames.map((game) => (
                  <FavoriteGameCard key={game.gameId} game={game} />
                ))}
              </div>
            ) : (
              <FavoriteGamesEmptyState />
            )}
          </div>
        </section>

        <section className="mt-8 flex flex-col items-center justify-center gap-3 pb-2 text-center">
          <div className="text-mypage-muted flex items-center gap-2 text-sm/6">
            <ShieldAlert size={16} />
            <span>
              더 이상 서비스를 이용하지 않으려면 회원탈퇴를 진행할 수 있습니다.
            </span>
          </div>
          <AuthButton
            type="button"
            variant="secondary"
            className="border-mypage-divider text-mypage-muted w-full max-w-44 hover:text-white"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            회원탈퇴
          </AuthButton>
        </section>
      </main>

      {toast ? (
        <ToastMessage
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <ConfirmModal
        open={isDeleteModalOpen}
        title="회원탈퇴 하시겠습니까?"
        description="탈퇴를 진행하면 현재 로그인 세션이 종료되고, 로그인 화면으로 이동합니다."
        confirmLabel="회원탈퇴"
        isPending={deleteAccountMutation.isPending}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          void handleDeleteAccount();
        }}
      />
    </div>
  );
}

export default MyPage;
