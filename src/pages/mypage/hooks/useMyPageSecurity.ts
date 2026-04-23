import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import {
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
} from '../../../features/auth/api/auth';
import {
  useChangePasswordMutation,
  useDeleteAccountMutation,
} from '../../../features/auth/api/useAuthApi';
import { clearAuthTokens } from '../../../utils/auth';
import type {
  PasswordChangeFieldName,
  PasswordChangeValues,
} from '../../../components/mypage/PasswordChangePanel';
import type { MyPageToastPayload } from '../types';

type PasswordTouchedState = Record<PasswordChangeFieldName, boolean>;
type PasswordFieldErrors = Partial<Record<PasswordChangeFieldName, string>>;
type PasswordPanelMessage = {
  tone: 'success' | 'error';
  message: string;
} | null;

type UseMyPageSecurityOptions = {
  onToast: (toast: MyPageToastPayload) => void;
};

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

function useMyPageSecurity({ onToast }: UseMyPageSecurityOptions) {
  const navigate = useNavigate();
  const changePasswordMutation = useChangePasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);
  const [passwordValues, setPasswordValues] = useState<PasswordChangeValues>(
    initialPasswordValues,
  );
  const [touchedState, setTouchedState] =
    useState<PasswordTouchedState>(initialTouchedState);
  const [apiFieldErrors, setApiFieldErrors] = useState<PasswordFieldErrors>({});
  const [passwordPanelMessage, setPasswordPanelMessage] =
    useState<PasswordPanelMessage>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const localFieldErrors = useMemo(
    () => getPasswordFieldErrors(passwordValues, touchedState),
    [passwordValues, touchedState],
  );

  const resolvedPasswordErrors: Record<PasswordChangeFieldName, string> = {
    currentPassword:
      apiFieldErrors.currentPassword ?? localFieldErrors.currentPassword,
    newPassword: apiFieldErrors.newPassword ?? localFieldErrors.newPassword,
    newPasswordConfirm:
      apiFieldErrors.newPasswordConfirm ?? localFieldErrors.newPasswordConfirm,
  };

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

  const togglePasswordPanel = () => {
    setIsPasswordPanelOpen((current) => {
      if (current) {
        resetPasswordPanel();
      }

      return !current;
    });
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

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeletePasswordError('');
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletePassword('');
    setDeletePasswordError('');
  };

  const handleDeletePasswordChange = (value: string) => {
    setDeletePassword(value);

    if (deletePasswordError) {
      setDeletePasswordError('');
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

      onToast({
        tone: 'error',
        message: errorMessage,
      });
    }
  };

  return {
    isPasswordPanelOpen,
    togglePasswordPanel,
    closePasswordPanel,
    passwordValues,
    resolvedPasswordErrors,
    passwordPanelMessage,
    handlePasswordValueChange,
    handlePasswordBlur,
    handlePasswordSubmit,
    isChangePasswordPending: changePasswordMutation.isPending,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    deletePassword,
    deletePasswordError,
    handleDeletePasswordChange,
    handleDeleteAccount,
    isDeleteAccountPending: deleteAccountMutation.isPending,
  };
}

export default useMyPageSecurity;
