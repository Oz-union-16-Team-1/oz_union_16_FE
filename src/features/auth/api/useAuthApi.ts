import { useMutation, useQuery } from '@tanstack/react-query';

import {
  checkIdDuplicate,
  checkNicknameDuplicate,
  changePassword,
  deleteAccount,
  getCurrentUserProfile,
  login,
  logout,
  signup,
} from './auth';

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
