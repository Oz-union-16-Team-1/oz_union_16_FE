import { useMutation } from '@tanstack/react-query';

import {
  checkIdDuplicate,
  checkNicknameDuplicate,
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
