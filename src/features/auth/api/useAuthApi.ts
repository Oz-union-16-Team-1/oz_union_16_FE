import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  checkIdDuplicate,
  checkNicknameDuplicate,
  changePassword,
  deleteAccount,
  getProfileImagePresignedUrl,
  getCurrentUserProfile,
  getLikedGames,
  login,
  logout,
  signup,
  unlikeLikedGame,
  uploadFileToS3,
} from './auth';
import type {
  LikedGamesResponse,
  LikedGamesRequest,
  ProfileImagePresignedUrlRequest,
  UploadFileToS3Request,
} from '../types/auth';

export const useLoginMutation = () =>
  useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: login,
  });

export const useSignupMutation = () =>
  useMutation({
    mutationKey: ['auth', 'signup'],
    mutationFn: signup,
  });

export const useLogoutMutation = () =>
  useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: logout,
  });

export const useCurrentUserProfileQuery = (enabled = true) =>
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUserProfile,
    enabled,
    staleTime: 60_000,
  });

export const useLikedGamesQuery = (
  enabled = true,
  payload: LikedGamesRequest = {},
) =>
  useQuery({
    queryKey: ['auth', 'me', 'game-like', payload.page ?? 1, payload.page_size],
    queryFn: () => getLikedGames(payload),
    enabled,
    staleTime: 60_000,
  });

export const useUnlikeLikedGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['auth', 'me', 'game-like', 'unlike'],
    mutationFn: unlikeLikedGame,
    onSuccess: (_, gameId) => {
      queryClient.setQueriesData<LikedGamesResponse>(
        { queryKey: ['auth', 'me', 'game-like'] },
        (current) => {
          if (!current) {
            return current;
          }

          const nextResults = current.results.filter(
            (likedGame) => likedGame.game_id !== gameId,
          );

          if (nextResults.length === current.results.length) {
            return current;
          }

          return {
            ...current,
            count: Math.max(0, current.count - 1),
            results: nextResults,
          };
        },
      );
      void queryClient.invalidateQueries({
        queryKey: ['auth', 'me', 'game-like'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['games', 'detail', gameId],
      });
    },
  });
};

export const useProfileImagePresignedUrlMutation = () =>
  useMutation({
    mutationKey: ['auth', 'me', 'profile-image', 'presigned-url'],
    mutationFn: (payload: ProfileImagePresignedUrlRequest) =>
      getProfileImagePresignedUrl(payload),
  });

export const useUploadFileToS3Mutation = () =>
  useMutation({
    mutationKey: ['auth', 'me', 'profile-image', 'upload'],
    mutationFn: (payload: UploadFileToS3Request) => uploadFileToS3(payload),
  });

export const useChangePasswordMutation = () =>
  useMutation({
    mutationKey: ['auth', 'change-password'],
    mutationFn: changePassword,
  });

export const useDeleteAccountMutation = () =>
  useMutation({
    mutationKey: ['auth', 'delete-account'],
    mutationFn: deleteAccount,
  });

export const useCheckIdDuplicateMutation = () =>
  useMutation({
    mutationKey: ['auth', 'check-id-duplicate'],
    mutationFn: checkIdDuplicate,
  });

export const useCheckNicknameDuplicateMutation = () =>
  useMutation({
    mutationKey: ['auth', 'check-nickname-duplicate'],
    mutationFn: checkNicknameDuplicate,
  });
