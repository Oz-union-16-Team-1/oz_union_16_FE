import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import AuthWrapper from '../../components/auth/AuthWrapper';
import LazyHeader from '../../components/common/LazyHeader';
import { ROUTE_PATHS } from '../../constants/routes';
import useAuthGate from '../../features/auth/hooks/useAuthGate';
import useLogoutAction from '../../features/auth/hooks/useLogoutAction';
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

const loadingFallback = (
  <div className="relative min-h-screen overflow-hidden bg-[#050505]">
    <LazyHeader fixed />
    <main className="mx-auto flex min-h-[calc(100dvh-6.1rem)] w-full max-w-[1240px] px-4 pt-[6.1rem] pb-10 sm:px-6 md:px-8 md:pt-[6.4rem]">
      <section className="survey-panel mx-auto w-full max-w-[920px] px-8 py-12 text-center text-white/68">
        인증 상태를 확인하는 중입니다...
      </section>
    </main>
  </div>
);

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
  const socialAccount = useAuthStore((state) => state.socialAccount);
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
            nickname={myPageProfile.profileNickname}
            name={myPageProfile.profileName}
            genderLabel={myPageProfile.profileGenderLabel}
            socialAccount={socialAccount}
            profileImageUrl={myPageProfile.profileImageUrl}
            isProfileLoading={myPageProfile.isProfileLoading}
            isProfileImageUploading={myPageProfile.isProfileImageUploading}
            isProfileUpdating={myPageProfile.isProfileUpdating}
            isLoggingOut={isLogoutPending}
            onLogout={() => {
              void logout();
            }}
            onNicknameSave={myPageProfile.handleNicknameSave}
            onProfileImageSelect={myPageProfile.handleProfileImageSelect}
            isPasswordPanelOpen={myPagePasswordChange.isPasswordPanelOpen}
            onPasswordToggle={myPagePasswordChange.togglePasswordPanel}
            passwordValues={myPagePasswordChange.passwordValues}
            passwordErrors={myPagePasswordChange.resolvedPasswordErrors}
            passwordPanelMessage={
              myPagePasswordChange.passwordPanelMessage?.message
            }
            passwordPanelMessageTone={
              myPagePasswordChange.passwordPanelMessage?.tone ?? 'error'
            }
            isPasswordChangePending={
              myPagePasswordChange.isChangePasswordPending
            }
            toast={toast}
            onToastClose={() => setToast(null)}
            onPasswordValueChange={
              myPagePasswordChange.handlePasswordValueChange
            }
            onPasswordBlur={myPagePasswordChange.handlePasswordBlur}
            onPasswordCancel={myPagePasswordChange.closePasswordPanel}
            onPasswordSubmit={myPagePasswordChange.handlePasswordSubmit}
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
