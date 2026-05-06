import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../../../store/useAuthStore';
import { syncAuthAccount } from '../utils/sessionManager';
import {
  confirmProfileImage,
  getProfileImagePresignedUrl,
  updateUserInfo,
  uploadFileToS3,
} from './auth';
import { authKeys } from './queryKeys';
import type {
  ConfirmProfileImageRequest,
  CurrentUserProfileResponse,
  ProfileImagePresignedUrlRequest,
  UpdateUserInfoResponse,
  UpdateUserInfoRequest,
  UploadFileToS3Request,
} from '../types/auth';

const mergeUpdatedUserInfo = (
  currentProfile: CurrentUserProfileResponse,
  response: UpdateUserInfoResponse,
): Partial<CurrentUserProfileResponse> => {
  const nextProfile: Partial<CurrentUserProfileResponse> = {};

  if (typeof response.nickname === 'string') {
    nextProfile.nickname = response.nickname;
  }

  if (response.profile_img_url !== undefined) {
    nextProfile.profile_img_url =
      response.profile_img_url ?? currentProfile.profile_img_url ?? null;
  }

  return nextProfile;
};

export const useProfileImagePresignedUrlMutation = () =>
  useMutation({
    mutationKey: authKeys.profileImagePresignedUrl(),
    mutationFn: (payload: ProfileImagePresignedUrlRequest) =>
      getProfileImagePresignedUrl(payload),
  });

export const useUploadFileToS3Mutation = () =>
  useMutation({
    mutationKey: authKeys.profileImageUpload(),
    mutationFn: (payload: UploadFileToS3Request) => uploadFileToS3(payload),
  });

export const useConfirmProfileImageMutation = () =>
  useMutation({
    mutationKey: authKeys.profileImageConfirm(),
    mutationFn: (payload: ConfirmProfileImageRequest) =>
      confirmProfileImage(payload),
  });

export const useUpdateUserInfoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: authKeys.updateUserInfo(),
    mutationFn: (payload: UpdateUserInfoRequest) => updateUserInfo(payload),
    onSuccess: (data) => {
      const cachedProfile =
        queryClient.getQueryData<CurrentUserProfileResponse>(authKeys.me()) ??
        useAuthStore.getState().account;

      if (!cachedProfile) {
        void queryClient.invalidateQueries({ queryKey: authKeys.me() });
        return;
      }

      const nextProfile: CurrentUserProfileResponse = {
        ...cachedProfile,
        ...mergeUpdatedUserInfo(cachedProfile, data),
      };

      queryClient.setQueryData(authKeys.me(), nextProfile);
      syncAuthAccount(nextProfile);
    },
  });
};
