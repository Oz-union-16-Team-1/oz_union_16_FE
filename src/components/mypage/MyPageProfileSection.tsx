import { Camera, CircleUserRound, LoaderCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import type { CurrentUserSocialResponse } from '../../features/auth/types/auth';
import type { MyPageToast } from '../../pages/mypage/types';
import AuthButton from '../auth/AuthButton';
import InputControl from '../common/InputControl';
import ToastMessage from './ToastMessage';

type MyPageProfileSectionProps = {
  nickname: string;
  name: string;
  genderLabel: string;
  socialAccount?: CurrentUserSocialResponse | null;
  profileImageUrl?: string | null;
  isProfileLoading?: boolean;
  isProfileImageUploading?: boolean;
  isProfileUpdating?: boolean;
  isLoggingOut: boolean;
  toast?: MyPageToast;
  onToastClose?: () => void;
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
  genderLabel,
  socialAccount = null,
  profileImageUrl = null,
  isProfileLoading = false,
  isProfileImageUploading = false,
  isProfileUpdating = false,
  isLoggingOut,
  toast = null,
  onToastClose,
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
  const normalizedSocialType = socialAccount?.social_type?.trim().toLowerCase();
  const accountBadge =
    socialAccount?.is_social === true
      ? normalizedSocialType === 'google'
        ? {
            label: '구글',
            className:
              'border-[#4285F4]/30 bg-[#4285F4]/14 text-[#8ab4ff] shadow-[0_8px_20px_rgba(66,133,244,0.14)]',
          }
        : normalizedSocialType === 'naver'
          ? {
              label: '네이버',
              className:
                'border-[#03C75A]/30 bg-[#03C75A]/14 text-[#68e6a5] shadow-[0_8px_20px_rgba(3,199,90,0.14)]',
            }
          : normalizedSocialType === 'kakao'
            ? {
                label: '카카오',
                className:
                  'border-[#FEE500]/24 bg-[#FEE500]/14 text-[#ffe768] shadow-[0_8px_20px_rgba(254,229,0,0.12)]',
              }
            : {
                label: '소셜회원',
                className:
                  'border-white/10 bg-white/[0.05] text-white/78 shadow-[0_8px_20px_rgba(255,255,255,0.05)]',
              }
      : {
          label: '일반회원',
          className:
            'border-white/10 bg-white/[0.05] text-white/78 shadow-[0_8px_20px_rgba(255,255,255,0.05)]',
        };

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
    <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[#19191d] shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
      <div className="h-[5.5rem] bg-[linear-gradient(135deg,#8b2836_0%,#aa3848_38%,#c84b5e_100%)] sm:h-[6.4rem]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
      {toast ? (
        <div className="pointer-events-none absolute inset-x-0 top-[2.7rem] z-80 flex justify-center px-4 sm:top-[3.05rem]">
          <ToastMessage
            message={toast.message}
            tone={toast.tone}
            onClose={onToastClose ?? (() => {})}
            variant="inlineCenter"
            className="pointer-events-auto"
          />
        </div>
      ) : null}

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
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="max-w-full truncate text-[clamp(2rem,3.6vw,2.8rem)] font-semibold tracking-[-0.04em] text-white">
                      {nickname}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[-0.01em] ${accountBadge.className}`}
                    >
                      {accountBadge.label}
                    </span>
                  </div>
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
            <div className="divide-y divide-white/7">
              <div className="py-5 pt-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white/76">별명</p>
                    {!isNicknameEditMode ? (
                      <p className="mt-2 truncate text-[1.05rem] font-medium text-white">
                        {nickname}
                      </p>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:min-w-[12rem] sm:justify-end">
                    {!isNicknameEditMode ? (
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/88 transition hover:border-white/12 hover:bg-white/[0.08]"
                        onClick={() => {
                          setIsNicknameEditMode(true);
                          setNextNickname(nickname);
                          setNicknameFieldError('');
                        }}
                      >
                        수정
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="bg-login-primary hover:bg-login-primary-hover inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            void handleNicknameSave();
                          }}
                          disabled={isProfileUpdating}
                        >
                          {isProfileUpdating ? '저장 중...' : '저장'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="py-5">
                <p className="text-sm font-semibold text-white/76">사용자명</p>
                <p className="mt-2 truncate text-[1.05rem] font-medium text-white">
                  {name}
                </p>
              </div>

              <div className="py-5 pb-1">
                <p className="text-sm font-semibold text-white/76">성별</p>
                <p className="mt-2 truncate text-[1.05rem] font-medium text-white">
                  {genderLabel}
                </p>
              </div>
            </div>
          </div>

          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default MyPageProfileSection;
