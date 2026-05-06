import { AxiosError } from 'axios';

type ToggleLikeErrorMessages = {
  loginRequired: string;
  defaultError: string;
  notFound?: string;
};

export const getToggleLikeErrorMessage = (
  error: unknown,
  messages: ToggleLikeErrorMessages,
) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return messages.loginRequired;
    }

    if (error.response?.status === 404 && messages.notFound) {
      return messages.notFound;
    }
  }

  return messages.defaultError;
};
