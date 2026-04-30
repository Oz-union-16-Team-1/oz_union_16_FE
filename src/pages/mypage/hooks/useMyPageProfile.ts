import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  extractAuthApiErrorMessage,
  extractAuthApiFieldErrors,
} from '../../../features/auth/api/auth.error.handler';
import { authKeys } from '../../../features/auth/api/queryKeys';
import {
  useConfirmProfileImageMutation,
  useCurrentUserProfileQuery,
  useProfileImagePresignedUrlMutation,
  useUpdateUserInfoMutation,
  useUploadFileToS3Mutation,
} from '../../../features/auth/api/useAuthApi';
import type { CurrentUserProfileResponse } from '../../../features/auth/types/auth';
import { useAuthStore } from '../../../store/useAuthStore';
import { syncAuthAccount } from '../../../features/auth/utils/sessionManager';
import type { MyPageToastPayload } from '../types';
import { toGenderLabel } from '../utils';

type UseMyPageProfileOptions = {
  enabled: boolean;
  onToast: (toast: MyPageToastPayload) => void;
};

function useMyPageProfile({ enabled, onToast }: UseMyPageProfileOptions) {
  const queryClient = useQueryClient();
  const profileQuery = useCurrentUserProfileQuery(enabled);
  const updateUserInfoMutation = useUpdateUserInfoMutation();
  const profileImagePresignedUrlMutation =
    useProfileImagePresignedUrlMutation();
  const uploadFileToS3Mutation = useUploadFileToS3Mutation();
  const confirmProfileImageMutation = useConfirmProfileImageMutation();
  const storedAccount = useAuthStore((state) => state.account);
  const cachedProfile = queryClient.getQueryData<CurrentUserProfileResponse>(
    authKeys.me(),
  );
  const resolvedProfile = profileQuery.data ?? storedAccount ?? cachedProfile;
  const isProfileLoading = profileQuery.isLoading && !resolvedProfile;
  const isProfileImageUploading =
    profileImagePresignedUrlMutation.isPending ||
    uploadFileToS3Mutation.isPending ||
    confirmProfileImageMutation.isPending;

  useEffect(() => {
    if (profileQuery.data) {
      syncAuthAccount(profileQuery.data);
    }
  }, [profileQuery.data]);

  const handleProfileImageSelect = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      onToast({
        tone: 'error',
        message: '이미지 파일만 업로드할 수 있습니다.',
      });
      return;
    }

    const previousProfile =
      queryClient.getQueryData<CurrentUserProfileResponse>(authKeys.me()) ??
      resolvedProfile ??
      null;
    let hasOptimisticProfileUpdate = false;

    try {
      const presignedResponse =
        await profileImagePresignedUrlMutation.mutateAsync({
          file_name: file.name,
          content_type: file.type || 'application/octet-stream',
        });
      const presignedUrl = presignedResponse.presigned_url.trim();
      const profileImageUrl = presignedResponse.img_url.trim();

      if (!presignedUrl || !profileImageUrl) {
        throw new Error(
          '프로필 이미지 업로드 경로를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      await uploadFileToS3Mutation.mutateAsync({
        presigned_url: presignedUrl,
        file,
        content_type: file.type || 'application/octet-stream',
      });

      queryClient.setQueryData<CurrentUserProfileResponse>(
        authKeys.me(),
        (currentProfile) =>
          currentProfile
            ? {
                ...currentProfile,
                profile_img_url: profileImageUrl,
              }
            : currentProfile,
      );

      if (previousProfile) {
        syncAuthAccount({
          ...previousProfile,
          profile_img_url: profileImageUrl,
        });
      }

      hasOptimisticProfileUpdate = true;

      await confirmProfileImageMutation.mutateAsync({
        profile_img_url: profileImageUrl,
      });
      const confirmedProfileImageUrl = profileImageUrl;

      queryClient.setQueryData<CurrentUserProfileResponse>(
        authKeys.me(),
        (currentProfile) =>
          currentProfile
            ? {
                ...currentProfile,
                profile_img_url: confirmedProfileImageUrl,
              }
            : currentProfile,
      );

      if (previousProfile) {
        syncAuthAccount({
          ...previousProfile,
          profile_img_url: confirmedProfileImageUrl,
        });
      }

      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      onToast({
        tone: 'success',
        message: '프로필이 변경되었습니다.',
      });
    } catch (error) {
      if (hasOptimisticProfileUpdate && previousProfile) {
        queryClient.setQueryData<CurrentUserProfileResponse>(
          authKeys.me(),
          previousProfile,
        );
        syncAuthAccount(previousProfile);
        void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      }

      onToast({
        tone: 'error',
        message: extractAuthApiErrorMessage(error),
      });
    }
  };

  const handleNicknameSave = async (nextNickname: string) => {
    try {
      await updateUserInfoMutation.mutateAsync({
        nickname: nextNickname,
      });
      onToast({
        tone: 'success',
        message: '닉네임이 변경되었습니다.',
      });

      return true;
    } catch (error) {
      const fieldErrors = extractAuthApiFieldErrors(error);
      const nicknameErrorMessage =
        fieldErrors.nickname || extractAuthApiErrorMessage(error);

      onToast({
        tone: 'error',
        message: nicknameErrorMessage,
      });

      return false;
    }
  };

  return {
    resolvedProfile,
    profileName: resolvedProfile?.name || 'N/A',
    profileEmail: resolvedProfile?.email || null,
    profileGenderLabel: toGenderLabel(resolvedProfile?.gender),
    profileImageUrl: resolvedProfile?.profile_img_url ?? null,
    profileNickname: resolvedProfile?.nickname ?? '회원',
    isProfileLoading,
    isProfileImageUploading,
    isProfileUpdating: updateUserInfoMutation.isPending,
    handleProfileImageSelect,
    handleNicknameSave,
  };
}

export default useMyPageProfile;
