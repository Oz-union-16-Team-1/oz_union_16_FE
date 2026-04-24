import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { isHeaderGuestActionHiddenPath } from '../../../constants/routeResolver';
import { useCurrentUserProfileQuery } from '../api/useAuthApi';
import { useAuthStore } from '../../../store/useAuthStore';
import { syncAuthAccount } from '../utils/sessionManager';
import useAuthSessionState from './useAuthSessionState';

function useHeaderAuthState() {
  const location = useLocation();
  const { accessStatus } = useAuthSessionState();
  const account = useAuthStore((state) => state.account);
  const profilePreviewImageUrl = useAuthStore(
    (state) => state.profilePreviewImageUrl,
  );
  const profileHydrationQuery = useCurrentUserProfileQuery(
    accessStatus === 'authenticated' && !account,
  );
  const resolvedProfileImageUrl =
    account?.profile_img_url ??
    profileHydrationQuery.data?.profile_img_url ??
    profilePreviewImageUrl;
  const shouldHideGuestActions = isHeaderGuestActionHiddenPath(
    location.pathname,
  );
  const isProfileHydrating =
    accessStatus === 'authenticated' &&
    !account &&
    (profileHydrationQuery.isLoading || profileHydrationQuery.isFetching);

  useEffect(() => {
    if (profileHydrationQuery.data) {
      syncAuthAccount(profileHydrationQuery.data);
    }
  }, [profileHydrationQuery.data]);

  return {
    accessStatus,
    resolvedProfileImageUrl,
    shouldHideGuestActions,
    shouldShowGuestActions:
      accessStatus === 'unauthenticated' && !shouldHideGuestActions,
    shouldShowDeferredGuestPreview:
      accessStatus === 'loading' &&
      !shouldHideGuestActions &&
      Boolean(resolvedProfileImageUrl),
    shouldShowGuestPlaceholder:
      accessStatus === 'loading' &&
      !shouldHideGuestActions &&
      !resolvedProfileImageUrl,
    shouldShowProfileMenu:
      accessStatus === 'authenticated' && !isProfileHydrating,
    shouldShowProfilePreview:
      accessStatus === 'authenticated' &&
      isProfileHydrating &&
      Boolean(resolvedProfileImageUrl),
    shouldShowProfilePlaceholder:
      accessStatus === 'authenticated' &&
      isProfileHydrating &&
      !resolvedProfileImageUrl,
  };
}

export default useHeaderAuthState;
