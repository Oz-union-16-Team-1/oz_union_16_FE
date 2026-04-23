import type { FormEvent } from 'react';
import { Heart, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

import AuthButton from '../../components/auth/AuthButton';
import Header from '../../components/common/Header';
import InputControl from '../../components/common/InputControl';
import ConfirmModal from '../../components/mypage/ConfirmModal';
import FavoriteGameCard from '../../components/mypage/FavoriteGameCard';
import FavoriteGameCardSkeleton from '../../components/mypage/FavoriteGameCardSkeleton';
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
  DEFAULT_LIKED_GAMES_PAGE_SIZE,
  useChangePasswordMutation,
  useConfirmProfileImageMutation,
  useCurrentUserProfileQuery,
  useDeleteAccountMutation,
  useLikedGamesInfiniteQuery,
  useProfileImagePresignedUrlMutation,
  useUpdateUserInfoMutation,
  useUnlikeLikedGameMutation,
  useUploadFileToS3Mutation,
} from '../../features/auth/api/useAuthApi';
import { authKeys } from '../../features/auth/api/queryKeys';
import useAuthGuardState from '../../features/auth/hooks/useAuthGuardState';
import useLogoutAction from '../../features/auth/hooks/useLogoutAction';
import type {
  AuthGender,
  CurrentUserProfileResponse,
  LikedGameItemResponse,
} from '../../features/auth/types/auth';
import GameDetailModal from '../../features/games/components/GameDetailModal';
import type { GameListItem } from '../../features/games/types';
import type { FavoriteGamePreview } from '../../features/mypage/types';
import { clearAuthTokens, setAuthAccount } from '../../utils/auth';
import { useAuthStore } from '../../store/useAuthStore';

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
            trimmedNewPassword.length < 8
          ? '비밀번호는 8자 이상이어야 합니다.'
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
  currentPassword: fieldErrors.old_password,
  newPassword: fieldErrors.new_password,
  newPasswordConfirm: fieldErrors.new_password_check,
});

const formatLikedAt = (likedAt: string) => {
  const date = new Date(likedAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('ko-KR');
};

const toFavoriteGamePreview = (
  game: LikedGameItemResponse,
): FavoriteGamePreview => {
  const normalizedGenres = game.genres.filter((genre) => genre.trim());
  const likedAtLabel = formatLikedAt(game.liked_at);

  const summaryParts = [
    normalizedGenres.length > 0
      ? `장르: ${normalizedGenres.join(', ')}`
      : '장르 정보 없음',
    likedAtLabel ? `찜한 날짜: ${likedAtLabel}` : null,
  ].filter(Boolean);

  return {
    gameId: game.game_id,
    title: game.game_title.trim() || 'N/A',
    summary: summaryParts.join(' · '),
    thumbnailUrl: game.thumbnail_url,
    genres: normalizedGenres,
  };
};

const toFavoriteGameListItem = (game: FavoriteGamePreview): GameListItem => ({
  gameId: game.gameId,
  name: game.title,
  genres: game.genres.length > 0 ? game.genres : ['N/A'],
  thumbnailUrl: game.thumbnailUrl,
  rating: null,
  isLiked: true,
});

const toGenderLabel = (gender?: AuthGender) => {
  if (gender === 'M') {
    return '남성';
  }

  if (gender === 'W') {
    return '여성';
  }

  return 'N/A';
};

function MyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canAccessAuthenticatedRoute, isAuthReady } = useAuthGuardState();
  const { logout, isPending: isLogoutPending } = useLogoutAction();
  const changePasswordMutation = useChangePasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const updateUserInfoMutation = useUpdateUserInfoMutation();
  const unlikeLikedGameMutation = useUnlikeLikedGameMutation();
  const profileImagePresignedUrlMutation =
    useProfileImagePresignedUrlMutation();
  const uploadFileToS3Mutation = useUploadFileToS3Mutation();
  const confirmProfileImageMutation = useConfirmProfileImageMutation();
  const profileQuery = useCurrentUserProfileQuery(canAccessAuthenticatedRoute);
  const likedGamesQuery = useLikedGamesInfiniteQuery(
    canAccessAuthenticatedRoute,
    DEFAULT_LIKED_GAMES_PAGE_SIZE,
  );
  const storedAccount = useAuthStore((state) => state.account);

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
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [selectedFavoriteGame, setSelectedFavoriteGame] =
    useState<FavoriteGamePreview | null>(null);
  const [selectedDetailGame, setSelectedDetailGame] =
    useState<GameListItem | null>(null);
  const favoriteGamesScrollRef = useRef<HTMLDivElement | null>(null);
  const favoriteGamesLoadMoreRef = useRef<HTMLDivElement | null>(null);

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
  const likedGameResults = useMemo(() => {
    const pages = likedGamesQuery.data?.pages ?? [];

    return pages.flatMap((page) => page.results);
  }, [likedGamesQuery.data]);

  const favoriteGames = useMemo(() => {
    const deduplicatedGames = new Map<number, LikedGameItemResponse>();

    likedGameResults.forEach((game) => {
      deduplicatedGames.set(game.game_id, game);
    });

    return [...deduplicatedGames.values()].map(toFavoriteGamePreview);
  }, [likedGameResults]);
  const hasFavoriteGamesNextPage = Boolean(likedGamesQuery.hasNextPage);
  const isFavoriteGamesFetchNextPageError =
    likedGamesQuery.isFetchNextPageError;
  const isFavoriteGamesFetchingNextPage = likedGamesQuery.isFetchingNextPage;
  const fetchNextFavoriteGamesPage = likedGamesQuery.fetchNextPage;

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
    if (profileQuery.data) {
      setAuthAccount(profileQuery.data);
    }
  }, [profileQuery.data]);

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

  useEffect(() => {
    if (isFavoriteGamesFetchNextPageError || !hasFavoriteGamesNextPage) {
      return undefined;
    }

    const rootElement = favoriteGamesScrollRef.current;
    const targetElement = favoriteGamesLoadMoreRef.current;

    if (!rootElement || !targetElement) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting || isFavoriteGamesFetchingNextPage) {
          return;
        }

        void fetchNextFavoriteGamesPage();
      },
      {
        root: rootElement,
        rootMargin: '0px 0px 160px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [
    favoriteGames.length,
    fetchNextFavoriteGamesPage,
    hasFavoriteGamesNextPage,
    isFavoriteGamesFetchNextPageError,
    isFavoriteGamesFetchingNextPage,
  ]);

  if (!isAuthReady) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#050505]">
        <Header fixed />
        <main className="mx-auto flex min-h-screen w-full max-w-[1240px] px-4 pt-[6.1rem] pb-12 sm:px-6 md:px-8 md:pt-[6.4rem]">
          <section className="survey-panel mx-auto w-full max-w-[920px] px-8 py-12 text-center text-white/68">
            인증 상태를 확인하는 중입니다...
          </section>
        </main>
      </div>
    );
  }

  if (!canAccessAuthenticatedRoute) {
    return (
      <Navigate
        to={`/${ROUTES.LOGIN}`}
        replace
        state={{ noticeMessage: '로그인 후 마이페이지를 이용할 수 있습니다.' }}
      />
    );
  }

  const favoriteCount =
    likedGamesQuery.data?.pages?.[0]?.count ?? favoriteGames.length;
  const resolvedProfile = profileQuery.data ?? storedAccount;
  const isProfileLoading = profileQuery.isLoading && !resolvedProfile;
  const isFavoriteGamesLoading =
    likedGamesQuery.isLoading && !favoriteGames.length;
  const isFavoriteGamesError = likedGamesQuery.isError && !favoriteGames.length;
  const profileName = resolvedProfile?.name || 'N/A';
  const profileEmail = resolvedProfile?.email || null;
  const profileGenderLabel = toGenderLabel(resolvedProfile?.gender);
  const profileImageUrl = resolvedProfile?.profile_img_url ?? null;
  const isProfileImageUploading =
    profileImagePresignedUrlMutation.isPending ||
    uploadFileToS3Mutation.isPending ||
    confirmProfileImageMutation.isPending;

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
        old_password: passwordValues.currentPassword.trim(),
        new_password: passwordValues.newPassword.trim(),
        new_password_check: passwordValues.newPasswordConfirm.trim(),
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
    const trimmedPassword = deletePassword.trim();

    if (!trimmedPassword) {
      setDeletePasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync({
        password: trimmedPassword,
      });

      clearAuthTokens();
      navigate(`/${ROUTES.LOGIN}`, {
        replace: true,
        state: {
          noticeMessage: '회원 탈퇴가 완료되었습니다.',
        },
      });
    } catch (error) {
      const fieldErrors = extractAuthApiFieldErrors(error);

      if (fieldErrors.password) {
        setDeletePasswordError(fieldErrors.password);
        return;
      }

      const errorMessage = extractAuthApiErrorMessage(error);

      if (errorMessage.includes('비밀번호')) {
        setDeletePasswordError(errorMessage);
        return;
      }

      setToast({
        tone: 'error',
        message: errorMessage,
      });
    }
  };

  const handleProfileImageSelect = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setToast({
        tone: 'error',
        message: '이미지 파일만 업로드할 수 있습니다.',
      });
      return;
    }

    const previousProfile =
      queryClient.getQueryData<CurrentUserProfileResponse>(authKeys.me()) ??
      resolvedProfile ??
      null;
    let hasOptimisticProfileUpdate = false;

    try {
      const presignedResponse =
        await profileImagePresignedUrlMutation.mutateAsync({
          file_name: file.name,
          content_type: file.type || 'application/octet-stream',
        });

      await uploadFileToS3Mutation.mutateAsync({
        presigned_url: presignedResponse.presigned_url,
        file,
        content_type: file.type || 'application/octet-stream',
      });

      queryClient.setQueryData<CurrentUserProfileResponse>(
        authKeys.me(),
        (currentProfile) =>
          currentProfile
            ? {
                ...currentProfile,
                profile_img_url: presignedResponse.img_url,
              }
            : currentProfile,
      );

      if (previousProfile) {
        setAuthAccount({
          ...previousProfile,
          profile_img_url: presignedResponse.img_url,
        });
      }

      hasOptimisticProfileUpdate = true;

      const confirmResponse = await confirmProfileImageMutation.mutateAsync({
        profile_img_url: presignedResponse.img_url,
      });
      const confirmedProfileImageUrl =
        confirmResponse.profile_img_url ?? presignedResponse.img_url;

      queryClient.setQueryData<CurrentUserProfileResponse>(
        authKeys.me(),
        (currentProfile) =>
          currentProfile
            ? {
                ...currentProfile,
                profile_img_url: confirmedProfileImageUrl,
              }
            : currentProfile,
      );

      if (previousProfile) {
        setAuthAccount({
          ...previousProfile,
          profile_img_url: confirmedProfileImageUrl,
        });
      }

      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      setToast({
        tone: 'success',
        message: '프로필이 변경되었습니다.',
      });
    } catch (error) {
      if (hasOptimisticProfileUpdate && previousProfile) {
        queryClient.setQueryData<CurrentUserProfileResponse>(
          authKeys.me(),
          previousProfile,
        );
        setAuthAccount(previousProfile);
        void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      }

      setToast({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
    }
  };

  const handleNicknameSave = async (nextNickname: string) => {
    try {
      await updateUserInfoMutation.mutateAsync({
        nickname: nextNickname,
      });
      setToast({
        tone: 'success',
        message: '프로필이 변경되었습니다.',
      });

      return true;
    } catch (error) {
      const fieldErrors = extractAuthApiFieldErrors(error);
      const nicknameErrorMessage =
        fieldErrors.nickname || extractAuthApiErrorMessage(error);

      setToast({
        tone: 'error',
        message: nicknameErrorMessage,
      });

      return false;
    }
  };

  const handleFavoriteGameCardClick = (game: FavoriteGamePreview) => {
    setSelectedDetailGame(toFavoriteGameListItem(game));
  };

  const handleFavoriteGameDeleteConfirm = async () => {
    if (!selectedFavoriteGame) {
      return;
    }

    try {
      const response = await unlikeLikedGameMutation.mutateAsync(
        selectedFavoriteGame.gameId,
      );

      setSelectedFavoriteGame(null);
      setToast({
        tone: 'success',
        message: response.detail || '찜한 게임이 목록에서 삭제되었습니다.',
      });
    } catch (error) {
      setToast({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-70" />
      <Header fixed />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pt-24 pb-14 sm:px-6 sm:pt-28 sm:pb-16 lg:px-10 lg:pt-32 xl:px-14">
        <MyPageProfileSection
          nickname={resolvedProfile?.nickname ?? '회원'}
          name={profileName}
          email={profileEmail}
          genderLabel={profileGenderLabel}
          profileImageUrl={profileImageUrl}
          isProfileLoading={isProfileLoading}
          isProfileImageUploading={isProfileImageUploading}
          isProfileUpdating={updateUserInfoMutation.isPending}
          isLoggingOut={isLogoutPending}
          isPasswordPanelOpen={isPasswordPanelOpen}
          onPasswordToggle={() => setIsPasswordPanelOpen((current) => !current)}
          onLogout={() => {
            void logout();
          }}
          onNicknameSave={handleNicknameSave}
          onProfileImageSelect={(file) => {
            void handleProfileImageSelect(file);
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
              {isFavoriteGamesLoading
                ? '찜 목록을 불러오는 중입니다.'
                : favoriteCount > 0
                  ? `총 ${favoriteCount}개의 게임이 저장되어 있어요`
                  : '아직 저장된 게임이 없어요'}
            </p>
          </div>

          <div
            ref={favoriteGamesScrollRef}
            className="mypage-scrollbar mt-5 max-h-[760px] overflow-y-auto pr-1"
          >
            {isFavoriteGamesLoading ? (
              <FavoriteGameCardSkeleton />
            ) : favoriteCount > 0 ? (
              <div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {favoriteGames.map((game) => (
                    <FavoriteGameCard
                      key={game.gameId}
                      game={game}
                      onClick={handleFavoriteGameCardClick}
                      onFavoriteClick={setSelectedFavoriteGame}
                    />
                  ))}
                </div>
                <div className="mt-5 flex flex-col items-center gap-2">
                  <div
                    ref={favoriteGamesLoadMoreRef}
                    aria-hidden="true"
                    className="h-0.5 w-full"
                  />
                  {likedGamesQuery.isFetchNextPageError ? (
                    <>
                      <p className="text-sm text-red-300">
                        추가 찜 목록을 불러오지 못했습니다.
                      </p>
                      <AuthButton
                        type="button"
                        variant="secondary"
                        className="w-full max-w-40"
                        onClick={() => void likedGamesQuery.fetchNextPage()}
                        disabled={likedGamesQuery.isFetchingNextPage}
                      >
                        {likedGamesQuery.isFetchingNextPage
                          ? '다시 불러오는 중...'
                          : '다시 시도'}
                      </AuthButton>
                    </>
                  ) : likedGamesQuery.isFetchingNextPage ? (
                    <p className="text-mypage-muted text-sm">
                      찜 목록을 더 불러오는 중입니다...
                    </p>
                  ) : hasFavoriteGamesNextPage ? (
                    <p className="text-mypage-muted text-sm">
                      아래로 스크롤하면 찜 목록을 더 볼 수 있어요.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : isFavoriteGamesError ? (
              <div
                role="status"
                aria-live="polite"
                className="border-mypage-divider bg-mypage-card flex min-h-56 flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed px-6 py-10 text-center"
              >
                <p className="text-sm text-red-300">
                  찜 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </p>
                <AuthButton
                  type="button"
                  variant="secondary"
                  className="w-full max-w-36"
                  onClick={() => void likedGamesQuery.refetch()}
                  disabled={
                    likedGamesQuery.isFetching ||
                    likedGamesQuery.isFetchingNextPage
                  }
                >
                  {likedGamesQuery.isFetching ||
                  likedGamesQuery.isFetchingNextPage
                    ? '다시 불러오는 중...'
                    : '다시 시도'}
                </AuthButton>
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
            onClick={() => {
              setDeletePassword('');
              setDeletePasswordError('');
              setIsDeleteModalOpen(true);
            }}
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
          variant="fixedCenter"
        />
      ) : null}

      <ConfirmModal
        open={isDeleteModalOpen}
        title="회원탈퇴 하시겠습니까?"
        description={
          <div className="space-y-3">
            <p>
              탈퇴를 진행하면 현재 로그인 세션이 종료되고, 로그인 화면으로
              이동합니다.
            </p>
            <div className="space-y-2">
              <label
                htmlFor="delete-account-password"
                className="block text-sm font-medium text-white"
              >
                현재 비밀번호
              </label>
              <InputControl
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => {
                  setDeletePassword(event.target.value);

                  if (deletePasswordError) {
                    setDeletePasswordError('');
                  }
                }}
                hasError={Boolean(deletePasswordError)}
                className="h-12"
                placeholder="현재 비밀번호를 입력하세요"
              />
              {deletePasswordError ? (
                <p className="pl-1 text-sm/5 font-medium text-red-400">
                  {deletePasswordError}
                </p>
              ) : null}
            </div>
          </div>
        }
        confirmLabel="회원탈퇴"
        isPending={deleteAccountMutation.isPending}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletePassword('');
          setDeletePasswordError('');
        }}
        onConfirm={() => {
          void handleDeleteAccount();
        }}
      />
      <ConfirmModal
        open={Boolean(selectedFavoriteGame)}
        title="찜한 게임을 삭제할까요?"
        description={`'${selectedFavoriteGame?.title ?? ''}'을(를) 찜한 목록에서 삭제하시겠습니까?`}
        confirmLabel="예"
        cancelLabel="아니오"
        isPending={unlikeLikedGameMutation.isPending}
        onClose={() => setSelectedFavoriteGame(null)}
        onConfirm={() => {
          void handleFavoriteGameDeleteConfirm();
        }}
      />
      {selectedDetailGame ? (
        <GameDetailModal
          key={selectedDetailGame.gameId}
          game={selectedDetailGame}
          onClose={() => setSelectedDetailGame(null)}
        />
      ) : null}
    </div>
  );
}

export default MyPage;
