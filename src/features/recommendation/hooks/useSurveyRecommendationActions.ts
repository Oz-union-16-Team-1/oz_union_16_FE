import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { ROUTES } from '../../../constants/routes';
import { useResetSurveyMutation } from '../../survey/api/useSurveyApi';
import { extractApiErrorMessage } from '../../survey/api/survey';
import { useSurveyStore } from '../../survey/store/useSurveyStore';

type UseSurveyRecommendationActionsParams = {
  canAccessPage: boolean;
  isSurveySource: boolean;
  onBeforeReset?: () => void;
  setFeedbackMessage: (message: string | null) => void;
};

export const useSurveyRecommendationActions = ({
  canAccessPage,
  isSurveySource,
  onBeforeReset,
  setFeedbackMessage,
}: UseSurveyRecommendationActionsParams) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const surveySessionId = useSurveyStore((state) => state.sessionId);
  const surveyRecommendationReady = useSurveyStore(
    (state) => state.recommendationReady,
  );
  const hydrateInitialSession = useSurveyStore(
    (state) => state.hydrateInitialSession,
  );
  const clearModerationState = useSurveyStore(
    (state) => state.clearModerationState,
  );
  const resetSurveyState = useSurveyStore((state) => state.resetSurveyState);
  const resetSurveyMutation = useResetSurveyMutation();
  const shouldShowSurveyActions =
    isSurveySource && canAccessPage && surveyRecommendationReady;

  const handleViewPreviousSurvey = () => {
    navigate(`/${ROUTES.SURVEY}?mode=history`);
  };

  const handleResetSurvey = async () => {
    if (resetSurveyMutation.isPending) {
      return;
    }

    setFeedbackMessage(null);

    if (!surveySessionId) {
      onBeforeReset?.();
      clearModerationState();
      resetSurveyState();
      queryClient.removeQueries({ queryKey: ['survey-results'] });
      navigate(`/${ROUTES.SURVEY}`);
      return;
    }

    try {
      const response = await resetSurveyMutation.mutateAsync();

      onBeforeReset?.();
      clearModerationState();
      hydrateInitialSession(response);
      queryClient.removeQueries({ queryKey: ['survey-results'] });
      navigate(`/${ROUTES.SURVEY}`);
    } catch (requestError) {
      setFeedbackMessage(extractApiErrorMessage(requestError));
    }
  };

  return {
    shouldShowSurveyActions,
    isResettingSurvey: resetSurveyMutation.isPending,
    handleViewPreviousSurvey,
    handleResetSurvey,
  };
};
