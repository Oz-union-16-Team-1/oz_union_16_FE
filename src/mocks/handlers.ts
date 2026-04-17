import { authHandlers } from '../features/auth/mocks/handlers';
import { matchingHandlers } from '../features/matching/mocks/handlers';
import { supportChatHandlers } from '../features/support-chat/mocks/handlers';
import { surveyHandlers } from '../features/survey/mocks/handlers';

export const handlers = [
  ...authHandlers,
  ...supportChatHandlers,
  ...surveyHandlers,
  ...matchingHandlers,
];
