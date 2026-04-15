import { useMutation } from '@tanstack/react-query';

import {
  checkIdDuplicate,
  checkNicknameDuplicate,
  login,
  signup,
} from './auth';

export const useLoginMutation = () =>
  useMutation({
    mutationFn: login,
  });

export const useSignupMutation = () =>
  useMutation({
    mutationFn: signup,
  });

export const useCheckIdDuplicateMutation = () =>
  useMutation({
    mutationFn: checkIdDuplicate,
  });

export const useCheckNicknameDuplicateMutation = () =>
  useMutation({
    mutationFn: checkNicknameDuplicate,
  });
