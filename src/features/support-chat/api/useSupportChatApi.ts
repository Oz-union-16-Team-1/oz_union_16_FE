import { useMutation } from '@tanstack/react-query';

import { sendChatbotMessage } from './chatbot';

export const useSendChatbotMessageMutation = () =>
  useMutation({
    mutationKey: ['support-chat', 'messages'],
    mutationFn: sendChatbotMessage,
  });
