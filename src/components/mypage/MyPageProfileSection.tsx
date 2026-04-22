import { CircleUserRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import AuthButton from '../auth/AuthButton';

type MyPageProfileSectionProps = {
  nickname: string;
  name: string;
  email: string | null;
  genderLabel: string;
  profileImageUrl?: string | null;
  isProfileLoading?: boolean;
  isProfileImageUploading?: boolean;
  isProfileUpdating?: boolean;
  isLoggingOut: boolean;
  isPasswordPanelOpen: boolean;
  onPasswordToggle: () => void;
  onLogout: () => void;
  onNicknameSave?: (nickname: string) => Promise<boolean>;
  onProfileImageSelect?: (file: File | null) => void;
  children?: ReactNode;
};

function MyPageProfileSection({
  nickname,
  name,
  email,
  genderLabel,
  profileImageUrl = null,
  isProfileLoading = false,
  isProfileImageUploading = false,
  isProfileUpdating = false,
  isLoggingOut,
  isPasswordPanelOpen,
  onPasswordToggle,
  onLogout,
  onNicknameSave,
  onProfileImageSelect,
  children,
}: MyPageProfileSectionProps) {
  const hasProfileImage = Boolean(profileImageUrl?.trim());
  const [isNicknameEditMode, setIsNicknameEditMode] = useState(false);
  const [nextNickname, setNextNickname] = useState(nickname);
  const [nicknameFieldError, setNicknameFieldError] = useState('');

  const handleNicknameSave = async () => {
    const trimmedNickname = nextNickname.trim();

    if (!trimmedNickname) {
      setNicknameFieldError('닉네임을 입력해주세요.');
      return;
    }

    if (trimmedNickname === nickname.trim()) {
      setIsNicknameEditMode(false);
      setNicknameFieldError('');
      return;
    }

    if (!onNicknameSave) {
      setIsNicknameEditMode(false);
      setNicknameFieldError('');
      return;
    }

    const isSuccess = await onNicknameSave(trimmedNickname);

    if (isSuccess) {
      setIsNicknameEditMode(false);
      setNicknameFieldError('');
    }
  };

  return (
    <section className="border-mypage-panel bg-mypage-panel shadow-mypage-float rounded-[28px] border px-5 py-8 text-center backdrop-blur-xl sm:px-8 sm:py-10">
      <h1 className="text-[clamp(2rem,4.8vw,2.75rem)] font-semibold text-white">
        마이페이지
      </h1>

      <div className="mt-8 flex justify-center">
        <div className="h-32 w-32 sm:h-36 sm:w-36">
          <div className="border-mypage-panel bg-mypage-card relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border shadow-[0_24px_50px_rgba(0,0,0,0.46),0_0_0_1px_rgba(255,255,255,0.03)]">
            {hasProfileImage ? (
              <img
                src={profileImageUrl!}
                alt={`${nickname} 프로필 이미지`}
                className="h-full w-full object-cover"
              />
            ) : (
              <CircleUserRound size={48} className="text-white/85" />
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <label className="border-mypage-panel bg-mypage-card text-mypage-muted focus-within:ring-mypage-panel inline-flex h-9 cursor-pointer items-center justify-center rounded-full border px-3 py-1.5 text-xs leading-none font-semibold whitespace-nowrap transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-[#050505] hover:text-white">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isProfileLoading || isProfileImageUploading}
            onChange={(event) => {
              onProfileImageSelect?.(event.target.files?.[0] ?? null);
              event.currentTarget.value = '';
            }}
          />
          {isProfileImageUploading ? '업로드 중...' : '프로필 변경'}
        </label>
      </div>

      {isProfileLoading ? (
        <div
          className="mt-5 flex flex-col items-center gap-3"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="h-8 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-full max-w-sm animate-pulse rounded-full bg-white/8" />
          <div className="border-mypage-panel bg-mypage-card mt-1 grid w-full max-w-[640px] gap-3 rounded-2xl border px-4 py-4 sm:grid-cols-3 sm:gap-4 sm:px-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-10 animate-pulse rounded-full bg-white/8" />
                <div className="h-5 w-full animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 flex justify-center">
            {isNicknameEditMode ? (
              <div className="w-full max-w-sm space-y-2">
                <label htmlFor="profile-nickname" className="sr-only">
                  닉네임
                </label>
                <input
                  id="profile-nickname"
                  type="text"
                  value={nextNickname}
                  onChange={(event) => {
                    setNextNickname(event.target.value);

                    if (nicknameFieldError) {
                      setNicknameFieldError('');
                    }
                  }}
                  maxLength={20}
                  disabled={isProfileUpdating}
                  className="auth-input-autofill placeholder-login-muted bg-login-field border-login-field h-12 w-full rounded-xl border px-4 text-base text-white transition outline-none hover:border-white/15 focus-visible:ring-2 focus-visible:ring-white/20"
                  placeholder="닉네임을 입력하세요"
                />
                {nicknameFieldError ? (
                  <p className="pl-1 text-left text-sm/5 font-medium text-red-400">
                    {nicknameFieldError}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="border-mypage-panel bg-mypage-card text-mypage-muted rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      setIsNicknameEditMode(false);
                      setNextNickname(nickname);
                      setNicknameFieldError('');
                    }}
                    disabled={isProfileUpdating}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="bg-login-primary rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#dd0d14] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      void handleNicknameSave();
                    }}
                    disabled={isProfileUpdating}
                  >
                    {isProfileUpdating ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-2xl font-semibold text-white">{nickname}</p>
                <button
                  type="button"
                  className="border-mypage-panel bg-mypage-card text-mypage-muted rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:text-white"
                  onClick={() => {
                    setIsNicknameEditMode(true);
                    setNextNickname(nickname);
                    setNicknameFieldError('');
                  }}
                >
                  닉네임 변경
                </button>
              </div>
            )}
          </div>
          <p className="text-mypage-muted mt-2 text-sm/6">
            계정 정보와 찜한 게임 목록을 한곳에서 관리할 수 있습니다.
          </p>
          <dl className="border-mypage-panel bg-mypage-card mt-5 grid gap-3 rounded-2xl border px-4 py-4 text-left text-sm/6 sm:grid-cols-3 sm:gap-4 sm:px-5">
            <div>
              <dt className="text-mypage-muted text-xs/5">이름</dt>
              <dd className="mt-1 font-medium text-white">{name}</dd>
            </div>
            <div>
              <dt className="text-mypage-muted text-xs/5">이메일</dt>
              <dd className="mt-1 truncate font-medium text-white">
                {email || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-mypage-muted text-xs/5">성별</dt>
              <dd className="mt-1 font-medium text-white">{genderLabel}</dd>
            </div>
          </dl>
        </>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <AuthButton
          type="button"
          variant="secondary"
          className="w-full sm:w-auto sm:min-w-36"
          onClick={onPasswordToggle}
        >
          {isPasswordPanelOpen ? '비밀번호 변경 닫기' : '비밀번호 변경'}
        </AuthButton>
        <AuthButton
          type="button"
          variant="secondary"
          className="w-full sm:w-auto sm:min-w-28"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        </AuthButton>
      </div>

      {children}
    </section>
  );
}

export default MyPageProfileSection;
