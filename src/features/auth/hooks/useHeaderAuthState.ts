import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { isHeaderGuestActionHiddenPath } from '../../../constants/routeResolver';
import { useCurrentUserProfileQuery } from '../api/useAuthApi';
import { useAuthStore } from '../../../store/useAuthStore';
import { syncAuthAccount } from '../utils/sessionManager';
import useAuthSessionState from './useAuthSessionState';

export type HeaderAuthPresentation =
  | { kind: 'hidden' }
  | { kind: 'guestActions' }
  | { kind: 'guestProfilePreview' }
  | { kind: 'guestPlaceholder' }
  | { kind: 'profileMenu' }
  | { kind: 'profilePreview' }
  | { kind: 'profilePlaceholder' };

type ResolveHeaderAuthPresentationParams = {
  accessStatus: 'loading' | 'authenticated' | 'unauthenticated';
  shouldHideGuestActions: boolean;
  isProfileHydrating: boolean;
  hasProfileImage: boolean;
};

const resolveHeaderAuthPresentation = ({
  accessStatus,
  shouldHideGuestActions,
  isProfileHydrating,
  hasProfileImage,
}: ResolveHeaderAuthPresentationParams): HeaderAuthPresentation => {
  if (shouldHideGuestActions) {
    return { kind: 'hidden' };
  }

  if (accessStatus === 'unauthenticated') {
    return { kind: 'guestActions' };
  }

  if (accessStatus === 'loading') {
    return hasProfileImage
      ? { kind: 'guestProfilePreview' }
      : { kind: 'guestPlaceholder' };
  }

  if (!isProfileHydrating) {
    return { kind: 'profileMenu' };
  }

  return hasProfileImage
    ? { kind: 'profilePreview' }
    : { kind: 'profilePlaceholder' };
};

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

  const authPresentation = resolveHeaderAuthPresentation({
    accessStatus,
    shouldHideGuestActions,
    isProfileHydrating,
    hasProfileImage: Boolean(resolvedProfileImageUrl),
  });

  return {
    resolvedProfileImageUrl,
    authPresentation,
  };
}

export default useHeaderAuthState;
