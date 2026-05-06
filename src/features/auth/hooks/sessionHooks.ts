import { useMutation, useQuery } from '@tanstack/react-query';

import { getCurrentUserProfile, login, logout, signup } from '../api/auth';
import { authKeys } from '../api/queryKeys';

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
