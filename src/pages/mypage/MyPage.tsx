import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import AuthWrapper from '../../components/auth/AuthWrapper';
import LazyHeader from '../../components/common/LazyHeader';
import MainPageLoadingFallback from '../../components/common/MainPageLoadingFallback';
import { ROUTE_PATHS } from '../../constants/routes';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import useLogoutAction from '../../features/auth/hooks/useLogoutAction';
import { isSocialLoginAccount } from '../../features/auth/utils/socialAccount';
import GameDetailModal from '../../features/games/components/GameDetailModal';
import type { GameListItem } from '../../features/games/types';
import { useAuthStore } from '../../store/useAuthStore';
import MyPageAccountDangerZone from './components/MyPageAccountDangerZone';
import MyPageLikedGamesSection from './components/MyPageLikedGamesSection';
import MyPageProfileContainer from './components/MyPageProfileContainer';
import useMyPageDeleteAccount from './hooks/useMyPageDeleteAccount';
import useMyPagePasswordChange from './hooks/useMyPagePasswordChange';
import useMyPageProfile from './hooks/useMyPageProfile';
import type { MyPageToast } from './types';

const loadingFallback = <MainPageLoadingFallback />;

const unauthorizedFallback = (
  <Navigate
    to={ROUTE_PATHS.LOGIN}
    replace
    state={{ noticeMessage: '로그인 후 마이페이지를 이용할 수 있습니다.' }}
  />
);

function MyPage() {
  const authGate = useAuthGate();
  const { logout, isPending: isLogoutPending } = useLogoutAction();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socialAccount = useAuthStore((state) => state.socialAccount);
  const isSocialAccount = isSocialLoginAccount(socialAccount);
  const canShowPasswordChange = isAuthenticated && !isSocialAccount;
  const [toast, setToast] = useState<MyPageToast>(null);
  const [selectedDetailGame, setSelectedDetailGame] =
    useState<GameListItem | null>(null);
  const myPageProfile = useMyPageProfile({
    enabled: authGate.canAccessAuthenticatedRoute,
    onToast: setToast,
  });
  const myPagePasswordChange = useMyPagePasswordChange();
  const myPageDeleteAccount = useMyPageDeleteAccount({
    onToast: setToast,
  });

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  return (
    <AuthWrapper
      gate={authGate}
      loadingFallback={loadingFallback}
      unauthorizedFallback={unauthorizedFallback}
    >
      <div className="relative min-h-screen overflow-hidden bg-[#050505]">
        <div className="app-aurora pointer-events-none absolute inset-0 opacity-70" />
        <LazyHeader fixed />

        <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-[1280px] flex-col px-4 pt-24 pb-10 sm:min-h-[calc(100dvh-7rem)] sm:px-6 sm:pt-28 sm:pb-12 lg:min-h-[calc(100dvh-8rem)] lg:px-10 lg:pt-32 xl:px-14">
          <MyPageProfileContainer
            profile={{
              nickname: myPageProfile.profileNickname,
              name: myPageProfile.profileName,
              genderLabel: myPageProfile.profileGenderLabel,
              socialAccount,
              profileImageUrl: myPageProfile.profileImageUrl,
              isLoading: myPageProfile.isProfileLoading,
              isImageUploading: myPageProfile.isProfileImageUploading,
              isUpdating: myPageProfile.isProfileUpdating,
              isLoggingOut: isLogoutPending,
              canShowPasswordChange,
              isPasswordPanelOpen: myPagePasswordChange.isPasswordPanelOpen,
              toast,
            }}
            profileActions={{
              onLogout: () => {
                void logout();
              },
              onNicknameSave: myPageProfile.handleNicknameSave,
              onProfileImageSelect: myPageProfile.handleProfileImageSelect,
              onPasswordToggle: myPagePasswordChange.togglePasswordPanel,
              onToastClose: () => setToast(null),
            }}
            passwordChange={{
              values: myPagePasswordChange.passwordValues,
              fieldRefs: myPagePasswordChange.passwordFieldRefs,
              errors: myPagePasswordChange.resolvedPasswordErrors,
              message: myPagePasswordChange.passwordPanelMessage?.message,
              messageTone:
                myPagePasswordChange.passwordPanelMessage?.tone ?? 'error',
              isPending: myPagePasswordChange.isChangePasswordPending,
            }}
            passwordChangeActions={{
              onValueChange: myPagePasswordChange.handlePasswordValueChange,
              onFieldBlur: myPagePasswordChange.handlePasswordBlur,
              onCancel: myPagePasswordChange.closePasswordPanel,
              onSubmit: myPagePasswordChange.handlePasswordSubmit,
            }}
          />

          <MyPageLikedGamesSection
            enabled={authGate.canAccessAuthenticatedRoute}
            onOpenGameDetail={setSelectedDetailGame}
            onToast={setToast}
          />

          <MyPageAccountDangerZone
            isSocialAccount={myPageDeleteAccount.isSocialAccount}
            isDeleteModalOpen={myPageDeleteAccount.isDeleteModalOpen}
            deletePassword={myPageDeleteAccount.deletePassword}
            deletePasswordError={myPageDeleteAccount.deletePasswordError}
            isDeletePending={myPageDeleteAccount.isDeleteAccountPending}
            onOpenDeleteModal={myPageDeleteAccount.openDeleteModal}
            onCloseDeleteModal={myPageDeleteAccount.closeDeleteModal}
            onDeletePasswordChange={
              myPageDeleteAccount.handleDeletePasswordChange
            }
            onConfirmDeleteAccount={myPageDeleteAccount.handleDeleteAccount}
          />
        </main>

        {selectedDetailGame ? (
          <GameDetailModal
            key={selectedDetailGame.gameId}
            game={selectedDetailGame}
            onClose={() => setSelectedDetailGame(null)}
          />
        ) : null}
      </div>
    </AuthWrapper>
  );
}

export default MyPage;
