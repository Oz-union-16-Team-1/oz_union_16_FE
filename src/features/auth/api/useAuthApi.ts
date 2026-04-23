import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  checkIdDuplicate,
  checkNicknameDuplicate,
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
  LikedGamesResponse,
  LikedGamesRequest,
  ProfileImagePresignedUrlRequest,
  UpdateUserInfoRequest,
  UploadFileToS3Request,
} from '../types/auth';
import { syncGameLikeStateInQueryCache } from '../../games/queryCache';
import { setAuthAccount } from '../../../utils/auth';

export const DEFAULT_LIKED_GAMES_PAGE_SIZE = 20;

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

export const useLikedGamesInfiniteQuery = (
  enabled = true,
  pageSize = DEFAULT_LIKED_GAMES_PAGE_SIZE,
) =>
  useInfiniteQuery({
    queryKey: authKeys.likedGamesInfinite({ page_size: pageSize }),
    queryFn: ({ pageParam }) =>
      getLikedGames({
        page: pageParam,
        page_size: pageSize,
      }),
    enabled,
    staleTime: 60_000,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedGameCount = allPages.reduce(
        (count, page) => count + page.results.length,
        0,
      );

      if (loadedGameCount >= lastPage.count) {
        return undefined;
      }

      return allPages.length + 1;
    },
  });

export const useUnlikeLikedGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: authKeys.unlikeLikedGame(),
    mutationFn: unlikeLikedGame,
    onSuccess: (_, gameId) => {
      queryClient.setQueriesData<LikedGamesResponse>(
        { queryKey: authKeys.likedGames() },
        (current) => {
          if (
            !current ||
            !Array.isArray((current as Partial<LikedGamesResponse>).results)
          ) {
            return current;
          }

          const currentLikedGames = current as LikedGamesResponse;
          const nextResults = currentLikedGames.results.filter(
            (likedGame) => likedGame.game_id !== gameId,
          );

          if (nextResults.length === currentLikedGames.results.length) {
            return current;
          }

          return {
            ...currentLikedGames,
            count: Math.max(0, currentLikedGames.count - 1),
            results: nextResults,
          };
        },
      );
      syncGameLikeStateInQueryCache(queryClient, {
        gameId,
        isLiked: false,
      });
      void queryClient.invalidateQueries({
        queryKey: authKeys.likedGames(),
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
      queryClient.setQueryData(authKeys.me(), data);
      setAuthAccount(data);
    },
  });
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
