import type { FormEvent } from 'react';

import MyPageProfileSection from '../../../components/mypage/MyPageProfileSection';
import PasswordChangePanel, {
  type PasswordChangeFieldName,
  type PasswordChangeValues,
} from '../../../components/mypage/PasswordChangePanel';

type MyPageProfileContainerProps = {
  nickname: string;
  name: string;
  genderLabel: string;
  profileImageUrl?: string | null;
  isProfileLoading: boolean;
  isProfileImageUploading: boolean;
  isProfileUpdating: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNicknameSave: (nickname: string) => Promise<boolean>;
  onProfileImageSelect: (file: File | null) => Promise<void>;
  isPasswordPanelOpen: boolean;
  onPasswordToggle: () => void;
  passwordValues: PasswordChangeValues;
  passwordErrors: Partial<Record<PasswordChangeFieldName, string>>;
  passwordPanelMessage?: string;
  passwordPanelMessageTone?: 'success' | 'error';
  isPasswordChangePending: boolean;
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
  profileImageUrl,
  isProfileLoading,
  isProfileImageUploading,
  isProfileUpdating,
  isLoggingOut,
  onLogout,
  onNicknameSave,
  onProfileImageSelect,
  isPasswordPanelOpen,
  onPasswordToggle,
  passwordValues,
  passwordErrors,
  passwordPanelMessage,
  passwordPanelMessageTone = 'error',
  isPasswordChangePending,
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
      profileImageUrl={profileImageUrl}
      isProfileLoading={isProfileLoading}
      isProfileImageUploading={isProfileImageUploading}
      isProfileUpdating={isProfileUpdating}
      isLoggingOut={isLoggingOut}
      isPasswordPanelOpen={isPasswordPanelOpen}
      onPasswordToggle={onPasswordToggle}
      onLogout={onLogout}
      onNicknameSave={onNicknameSave}
      onProfileImageSelect={(file) => {
        void onProfileImageSelect(file);
      }}
    >
      {isPasswordPanelOpen ? (
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
