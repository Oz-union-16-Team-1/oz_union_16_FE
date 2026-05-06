import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  checkIdDuplicate,
  checkNicknameDuplicate,
  checkPassword,
  changePassword,
  confirmProfileImage,
  deleteAccount,
  getProfileImagePresignedUrl,
  getCurrentUserProfile,
  getLikedGames,
  login,
  logout,
  signup,
  unlikeLikedGame,
  updateUserInfo,
  uploadFileToS3,
} from './auth';
import { authKeys } from './queryKeys';
import type {
  ConfirmProfileImageRequest,
  CurrentUserProfileResponse,
  LikedGamesRequest,
  ProfileImagePresignedUrlRequest,
  UpdateUserInfoResponse,
  UpdateUserInfoRequest,
  UploadFileToS3Request,
} from '../types/auth';
import { syncLikeMutationStateInQueryCache } from '../../games/queryCache';
import { syncAuthAccount } from '../utils/sessionManager';
import { useAuthStore } from '../../../store/useAuthStore';

const LIKED_GAMES_PAGE_SIZE = 20;

export const useLoginMutation = () =>
  useMutation({
    mutationKey: authKeys.login(),
    mutationFn: login,
  });

export const useSignupMutation = () =>
  useMutation({
    mutationKey: authKeys.signup(),
    mutationFn: signup,
  });

export const useLogoutMutation = () =>
  useMutation({
    mutationKey: authKeys.logout(),
    mutationFn: logout,
  });

export const useCurrentUserProfileQuery = (enabled = true) =>
  useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUserProfile,
    enabled,
    staleTime: 60_000,
  });

export const useLikedGamesQuery = (
  enabled = true,
  payload: LikedGamesRequest = {},
) =>
  useQuery({
    queryKey: authKeys.likedGamesList(payload),
    queryFn: () => getLikedGames(payload),
    enabled,
    staleTime: 60_000,
  });

export const useInfiniteLikedGamesQuery = (
  enabled = true,
  payload: LikedGamesRequest = {},
) => {
  const pageSize = payload.page_size ?? LIKED_GAMES_PAGE_SIZE;
  const initialPage = payload.page ?? 1;

  return useInfiniteQuery({
    queryKey: authKeys.likedGamesInfiniteList({
      page_size: pageSize,
    }),
    queryFn: ({ pageParam }) =>
      getLikedGames({
        ...payload,
        page: pageParam,
        page_size: pageSize,
      }),
    initialPageParam: initialPage,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (totalCount, page) =>
          totalCount + (Array.isArray(page.results) ? page.results.length : 0),
        0,
      );
      const totalCount =
        typeof lastPage.count === 'number' ? lastPage.count : loadedCount;

      return loadedCount < totalCount
        ? initialPage + allPages.length
        : undefined;
    },
    enabled,
    staleTime: 60_000,
  });
};

export const useUnlikeLikedGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: authKeys.unlikeLikedGame(),
    mutationFn: unlikeLikedGame,
    onSuccess: (_, gameId) => {
      syncLikeMutationStateInQueryCache(queryClient, {
        gameId,
        isLiked: false,
      });
    },
  });
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

export const useChangePasswordMutation = () =>
  useMutation({
    mutationKey: authKeys.changePassword(),
    mutationFn: changePassword,
  });

export const useCheckPasswordMutation = () =>
  useMutation({
    mutationKey: authKeys.checkPassword(),
    mutationFn: checkPassword,
  });

export const useDeleteAccountMutation = () =>
  useMutation({
    mutationKey: authKeys.deleteAccount(),
    mutationFn: deleteAccount,
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

export const useCheckIdDuplicateMutation = () =>
  useMutation({
    mutationKey: authKeys.checkIdDuplicate(),
    mutationFn: checkIdDuplicate,
  });

export const useCheckNicknameDuplicateMutation = () =>
  useMutation({
    mutationKey: authKeys.checkNicknameDuplicate(),
    mutationFn: checkNicknameDuplicate,
  });
