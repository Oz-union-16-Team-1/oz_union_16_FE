import type { FormEvent } from 'react';

import MyPageProfileSection from '../../../components/mypage/MyPageProfileSection';
import PasswordChangePanel, {
  type PasswordChangeFieldName,
  type PasswordChangeValues,
} from '../../../components/mypage/PasswordChangePanel';
import type { CurrentUserSocialResponse } from '../../../features/auth/types/auth';
import type { MyPageToast } from '../types';

type MyPageProfileContainerProps = {
  nickname: string;
  name: string;
  genderLabel: string;
  socialAccount?: CurrentUserSocialResponse | null;
  profileImageUrl?: string | null;
  isProfileLoading: boolean;
  isProfileImageUploading: boolean;
  isProfileUpdating: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNicknameSave: (nickname: string) => Promise<boolean>;
  onProfileImageSelect: (file: File | null) => Promise<void>;
  canShowPasswordChange: boolean;
  isPasswordPanelOpen: boolean;
  onPasswordToggle: () => void;
  passwordValues: PasswordChangeValues;
  passwordErrors: Partial<Record<PasswordChangeFieldName, string>>;
  passwordPanelMessage?: string;
  passwordPanelMessageTone?: 'success' | 'error';
  isPasswordChangePending: boolean;
  toast: MyPageToast;
  onToastClose: () => void;
  onPasswordValueChange: (
    fieldName: PasswordChangeFieldName,
    value: string,
  ) => void;
  onPasswordBlur: (fieldName: PasswordChangeFieldName) => void;
  onPasswordCancel: () => void;
  onPasswordSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function MyPageProfileContainer({
  nickname,
  name,
  genderLabel,
  socialAccount = null,
  profileImageUrl,
  isProfileLoading,
  isProfileImageUploading,
  isProfileUpdating,
  isLoggingOut,
  onLogout,
  onNicknameSave,
  onProfileImageSelect,
  canShowPasswordChange,
  isPasswordPanelOpen,
  onPasswordToggle,
  passwordValues,
  passwordErrors,
  passwordPanelMessage,
  passwordPanelMessageTone = 'error',
  isPasswordChangePending,
  toast,
  onToastClose,
  onPasswordValueChange,
  onPasswordBlur,
  onPasswordCancel,
  onPasswordSubmit,
}: MyPageProfileContainerProps) {
  return (
    <MyPageProfileSection
      nickname={nickname}
      name={name}
      genderLabel={genderLabel}
      socialAccount={socialAccount}
      profileImageUrl={profileImageUrl}
      isProfileLoading={isProfileLoading}
      isProfileImageUploading={isProfileImageUploading}
      isProfileUpdating={isProfileUpdating}
      isLoggingOut={isLoggingOut}
      toast={toast}
      onToastClose={onToastClose}
      canShowPasswordChange={canShowPasswordChange}
      isPasswordPanelOpen={isPasswordPanelOpen}
      onPasswordToggle={onPasswordToggle}
      onLogout={onLogout}
      onNicknameSave={onNicknameSave}
      onProfileImageSelect={(file) => {
        void onProfileImageSelect(file);
      }}
    >
      {canShowPasswordChange && isPasswordPanelOpen ? (
        <PasswordChangePanel
          values={passwordValues}
          errors={passwordErrors}
          message={passwordPanelMessage}
          messageTone={passwordPanelMessageTone}
          isPending={isPasswordChangePending}
          onValueChange={onPasswordValueChange}
          onFieldBlur={onPasswordBlur}
          onCancel={onPasswordCancel}
          onSubmit={onPasswordSubmit}
        />
      ) : null}
    </MyPageProfileSection>
  );
}

export default MyPageProfileContainer;
