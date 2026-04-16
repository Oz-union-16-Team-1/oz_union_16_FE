import { CircleUserRound } from 'lucide-react';
import type { ReactNode } from 'react';

import AuthButton from '../auth/AuthButton';

type MyPageProfileSectionProps = {
  nickname: string;
  isProfileLoading?: boolean;
  isLoggingOut: boolean;
  isPasswordPanelOpen: boolean;
  onPasswordToggle: () => void;
  onLogout: () => void;
  children?: ReactNode;
};

function MyPageProfileSection({
  nickname,
  isProfileLoading = false,
  isLoggingOut,
  isPasswordPanelOpen,
  onPasswordToggle,
  onLogout,
  children,
}: MyPageProfileSectionProps) {
  return (
    <section className="border-mypage-panel bg-mypage-panel shadow-mypage-float rounded-[28px] border px-5 py-8 text-center backdrop-blur-xl sm:px-8 sm:py-10">
      <h1 className="text-[clamp(2rem,4.8vw,2.75rem)] font-semibold text-white">
        마이페이지
      </h1>

      <div className="mt-8 flex justify-center">
        <div className="border-mypage-panel bg-mypage-card flex h-28 w-28 items-center justify-center rounded-full border">
          <CircleUserRound size={42} className="text-white/85" />
        </div>
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
