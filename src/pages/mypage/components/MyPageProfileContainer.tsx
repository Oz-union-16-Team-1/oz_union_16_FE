import type { FormEvent, RefObject } from 'react';

import MyPageProfileSection from '../../../components/mypage/MyPageProfileSection';
import PasswordChangePanel, {
  type PasswordChangeFieldName,
  type PasswordChangeValues,
} from '../../../components/mypage/PasswordChangePanel';
import type { CurrentUserSocialResponse } from '../../../features/auth/types/auth';
import type { MyPageToast } from '../types';

type MyPageProfileViewModel = {
  nickname: string;
  name: string;
  genderLabel: string;
  socialAccount?: CurrentUserSocialResponse | null;
  profileImageUrl?: string | null;
  isLoading: boolean;
  isImageUploading: boolean;
  isUpdating: boolean;
  isLoggingOut: boolean;
  canShowPasswordChange: boolean;
  isPasswordPanelOpen: boolean;
  toast: MyPageToast;
};

type MyPageProfileActions = {
  onLogout: () => void;
  onNicknameSave: (nickname: string) => Promise<boolean>;
  onProfileImageSelect: (file: File | null) => Promise<void>;
  onPasswordToggle: () => void;
  onToastClose: () => void;
};

type MyPagePasswordChangeViewModel = {
  values: PasswordChangeValues;
  fieldRefs: Record<
    PasswordChangeFieldName,
    RefObject<HTMLInputElement | null>
  >;
  errors: Partial<Record<PasswordChangeFieldName, string>>;
  message?: string;
  messageTone?: 'success' | 'error';
  isPending: boolean;
};

type MyPagePasswordChangeActions = {
  onValueChange: (fieldName: PasswordChangeFieldName, value: string) => void;
  onFieldBlur: (fieldName: PasswordChangeFieldName) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type MyPageProfileContainerProps = {
  profile: MyPageProfileViewModel;
  profileActions: MyPageProfileActions;
  passwordChange: MyPagePasswordChangeViewModel;
  passwordChangeActions: MyPagePasswordChangeActions;
};

function MyPageProfileContainer({
  profile,
  profileActions,
  passwordChange,
  passwordChangeActions,
}: MyPageProfileContainerProps) {
  const {
    nickname,
    name,
    genderLabel,
    socialAccount = null,
    profileImageUrl,
    isLoading,
    isImageUploading,
    isUpdating,
    isLoggingOut,
    canShowPasswordChange,
    isPasswordPanelOpen,
    toast,
  } = profile;
  const {
    onLogout,
    onNicknameSave,
    onProfileImageSelect,
    onPasswordToggle,
    onToastClose,
  } = profileActions;
  const {
    values,
    fieldRefs,
    errors,
    message,
    messageTone = 'error',
    isPending,
  } = passwordChange;
  const { onValueChange, onFieldBlur, onCancel, onSubmit } =
    passwordChangeActions;

  return (
    <MyPageProfileSection
      nickname={nickname}
      name={name}
      genderLabel={genderLabel}
      socialAccount={socialAccount}
      profileImageUrl={profileImageUrl}
      isProfileLoading={isLoading}
      isProfileImageUploading={isImageUploading}
      isProfileUpdating={isUpdating}
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
          values={values}
          fieldRefs={fieldRefs}
          errors={errors}
          message={message}
          messageTone={messageTone}
          isPending={isPending}
          onValueChange={onValueChange}
          onFieldBlur={onFieldBlur}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ) : null}
    </MyPageProfileSection>
  );
}

export default MyPageProfileContainer;
