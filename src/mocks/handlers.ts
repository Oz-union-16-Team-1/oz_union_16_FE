import { authHandlers } from '../features/auth/mocks/handlers';
import { surveyHandlers } from '../features/survey/mocks/handlers';

export const handlers = [...authHandlers, ...surveyHandlers];
