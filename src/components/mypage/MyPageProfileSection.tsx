import { CircleUserRound } from 'lucide-react';
import type { ReactNode } from 'react';

import AuthButton from '../auth/AuthButton';

type MyPageProfileSectionProps = {
  nickname: string;
  name: string;
  email: string | null;
  genderLabel: string;
  profileImageUrl?: string | null;
  isProfileLoading?: boolean;
  isProfileImageUploading?: boolean;
  isLoggingOut: boolean;
  isPasswordPanelOpen: boolean;
  onPasswordToggle: () => void;
  onLogout: () => void;
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
  isLoggingOut,
  isPasswordPanelOpen,
  onPasswordToggle,
  onLogout,
  onProfileImageSelect,
  children,
}: MyPageProfileSectionProps) {
  const hasProfileImage = Boolean(profileImageUrl?.trim());

  return (
    <section className="border-mypage-panel bg-mypage-panel shadow-mypage-float rounded-[28px] border px-5 py-8 text-center backdrop-blur-xl sm:px-8 sm:py-10">
      <h1 className="text-[clamp(2rem,4.8vw,2.75rem)] font-semibold text-white">
        마이페이지
      </h1>

      <div className="mt-8 flex justify-center">
        <div className="border-mypage-panel bg-mypage-card relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border">
          {hasProfileImage ? (
            <img
              src={profileImageUrl!}
              alt={`${nickname} 프로필 이미지`}
              className="h-full w-full object-cover"
            />
          ) : (
            <CircleUserRound size={42} className="text-white/85" />
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <label className="border-mypage-panel bg-mypage-card text-mypage-muted focus-within:ring-mypage-panel relative inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-[#050505] hover:text-white">
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
          {isProfileImageUploading ? '업로드 중...' : '프로필 이미지 변경'}
        </label>
      </div>

      {isProfileLoading ? (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="h-8 w-32 animate-pulse rounded-full bg-white/8" />
          <div className="h-4 w-full max-w-sm animate-pulse rounded-full bg-white/6" />
        </div>
      ) : (
        <>
          <p className="mt-5 text-2xl font-semibold text-white">{nickname}</p>
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
