import { useMutation } from '@tanstack/react-query';

import {
  changePassword,
  checkIdDuplicate,
  checkNicknameDuplicate,
  checkPassword,
  deleteAccount,
} from './auth';
import { authKeys } from './queryKeys';

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
