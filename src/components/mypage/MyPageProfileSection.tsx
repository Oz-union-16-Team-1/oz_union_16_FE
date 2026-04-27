import { Camera, CircleUserRound, LoaderCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import AuthButton from '../auth/AuthButton';
import InputControl from '../common/InputControl';

type MyPageProfileSectionProps = {
  nickname: string;
  name: string;
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

type ProfileInfoRow = {
  label: string;
  value: string;
  action?: ReactNode;
};

function MyPageProfileSection({
  nickname,
  name,
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
  const normalizedProfileImageUrl = profileImageUrl?.trim() ?? '';
  const [failedProfileImageUrl, setFailedProfileImageUrl] = useState<
    string | null
  >(null);
  const hasProfileImage =
    Boolean(normalizedProfileImageUrl) &&
    failedProfileImageUrl !== normalizedProfileImageUrl;
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

  const infoRows: ProfileInfoRow[] = [
    {
      label: '별명',
      value: nickname,
      action: !isNicknameEditMode ? (
        <button
          type="button"
          className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/88 transition hover:border-white/12 hover:bg-white/[0.08]"
          onClick={() => {
            setIsNicknameEditMode(true);
            setNextNickname(nickname);
            setNicknameFieldError('');
          }}
        >
          수정
        </button>
      ) : null,
    },
    {
      label: '사용자명',
      value: name,
    },
    {
      label: '성별',
      value: genderLabel,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[#19191d] shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
      <div className="h-[5.5rem] bg-[linear-gradient(135deg,#8b2836_0%,#aa3848_38%,#c84b5e_100%)] sm:h-[6.4rem]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

      <div className="relative px-4 pt-0 pb-5 sm:px-6 sm:pb-7 lg:px-8 lg:pb-8">
        <div className="mt-0 rounded-[28px] bg-[#111114] px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8 lg:pb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="-mt-9 sm:-mt-10">
                <div className="group relative h-[8.4rem] w-[8.4rem] sm:h-[9.2rem] sm:w-[9.2rem]">
                  <label className="absolute inset-0 block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isProfileLoading || isProfileImageUploading}
                      onChange={(event) => {
                        onProfileImageSelect?.(event.target.files?.[0] ?? null);
                        event.currentTarget.value = '';
                        event.currentTarget.blur();
                      }}
                    />
                    <span className="sr-only">
                      {isProfileImageUploading
                        ? '프로필 이미지 업로드 중'
                        : '프로필 변경'}
                    </span>
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[0.72rem] border-[#111114] bg-[linear-gradient(145deg,#8a4d55_0%,#78424a_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
                      {hasProfileImage ? (
                        <img
                          src={normalizedProfileImageUrl}
                          alt={`${nickname} 프로필 이미지`}
                          onError={() =>
                            setFailedProfileImageUrl(normalizedProfileImageUrl)
                          }
                          className={`h-full w-full object-cover transition duration-200 ${
                            isProfileImageUploading
                              ? 'blur-[1.8px] brightness-[0.58]'
                              : 'group-hover:blur-[1.8px] group-hover:brightness-[0.58]'
                          }`}
                        />
                      ) : (
                        <CircleUserRound
                          size={56}
                          className="text-white transition duration-200 group-hover:opacity-75"
                        />
                      )}
                      <span
                        className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-full transition ${
                          isProfileImageUploading
                            ? 'bg-black/45 opacity-100'
                            : 'bg-black/0 opacity-0 group-hover:bg-black/38 group-hover:opacity-100'
                        }`}
                      >
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                          {isProfileImageUploading ? (
                            <LoaderCircle size={16} className="animate-spin" />
                          ) : (
                            <Camera size={16} />
                          )}
                        </span>
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {isProfileLoading ? (
                <div
                  className="min-w-0 space-y-3"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="mt-2 h-9 w-44 animate-pulse rounded-full bg-white/10" />
                  <div className="h-5 w-28 animate-pulse rounded-full bg-white/8" />
                </div>
              ) : (
                <div className="min-w-0 pt-2">
                  <p className="truncate text-[clamp(2rem,3.6vw,2.8rem)] font-semibold tracking-[-0.04em] text-white">
                    {nickname}
                  </p>
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <AuthButton
                type="button"
                variant="secondary"
                className="w-full border-white/10 bg-white/[0.05] shadow-none hover:bg-white/[0.08] sm:min-w-36"
                onClick={onPasswordToggle}
              >
                {isPasswordPanelOpen ? '비밀번호 변경 닫기' : '비밀번호 변경'}
              </AuthButton>
              <AuthButton
                type="button"
                variant="secondary"
                className="w-full border-white/10 bg-white/[0.05] shadow-none hover:bg-white/[0.08] sm:min-w-28"
                onClick={onLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </AuthButton>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.035] px-4 py-4 sm:px-5 sm:py-5">
            {isNicknameEditMode ? (
              <div className="border-b border-white/7 pb-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white/82">별명</p>
                    <label htmlFor="profile-nickname" className="sr-only">
                      닉네임
                    </label>
                    <div className="mt-3 max-w-xl">
                      <InputControl
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
                        hasError={Boolean(nicknameFieldError)}
                        className="h-12"
                        placeholder="닉네임을 입력하세요"
                      />
                    </div>
                    {nicknameFieldError ? (
                      <p className="mt-2 pl-1 text-left text-sm/5 font-medium text-red-400">
                        {nicknameFieldError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 lg:pt-8">
                    <button
                      type="button"
                      className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/[0.08]"
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
                      className="bg-login-primary hover:bg-login-primary-hover rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        void handleNicknameSave();
                      }}
                      disabled={isProfileUpdating}
                    >
                      {isProfileUpdating ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="divide-y divide-white/7">
              {infoRows.map((row, index) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-4 py-5 ${
                    index === 0 && isNicknameEditMode
                      ? 'pt-5'
                      : index === 0
                        ? 'pt-1'
                        : ''
                  } ${index === infoRows.length - 1 ? 'pb-1' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/76">
                      {row.label}
                    </p>
                    <p className="mt-2 truncate text-[1.05rem] font-medium text-white">
                      {row.value}
                    </p>
                  </div>
                  {row.action ? (
                    <div className="shrink-0">{row.action}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default MyPageProfileSection;
