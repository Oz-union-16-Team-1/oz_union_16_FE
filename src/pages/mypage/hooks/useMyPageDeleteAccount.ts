import { useState } from 'react';
import { useNavigate } from 'react-router';

import { ROUTE_PATHS } from '../../../constants/routes';
import {
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
} from '../../../features/auth/api/auth';
import {
  useCheckPasswordMutation,
  useDeleteAccountMutation,
} from '../../../features/auth/api/useAuthApi';
import { clearAuthSession } from '../../../features/auth/utils/sessionManager';
import { useAuthStore } from '../../../store/useAuthStore';
import type { MyPageToastPayload } from '../types';

type UseMyPageDeleteAccountOptions = {
  onToast: (toast: MyPageToastPayload) => void;
};

function useMyPageDeleteAccount({ onToast }: UseMyPageDeleteAccountOptions) {
  const navigate = useNavigate();
  const checkPasswordMutation = useCheckPasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const socialAccount = useAuthStore((state) => state.socialAccount);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const isSocialAccount = socialAccount?.is_social === true;

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

    if (!isSocialAccount && !trimmedPassword) {
      setDeletePasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }

    try {
      if (!isSocialAccount) {
        await checkPasswordMutation.mutateAsync({
          password: trimmedPassword,
        });
      }

      await deleteAccountMutation.mutateAsync();

      closeDeleteModal();
      clearAuthSession();
      navigate(ROUTE_PATHS.LOGIN, {
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
    isSocialAccount,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    deletePassword,
    deletePasswordError,
    handleDeletePasswordChange,
    handleDeleteAccount,
    isDeleteAccountPending:
      checkPasswordMutation.isPending || deleteAccountMutation.isPending,
  };
}

export default useMyPageDeleteAccount;
