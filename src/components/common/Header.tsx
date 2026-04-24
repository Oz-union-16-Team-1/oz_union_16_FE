import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ROUTES } from '../../constants/routes';
import { useCurrentUserProfileQuery } from '../../features/auth/api/useAuthApi';
import { useAuthStore } from '../../store/useAuthStore';
import HeaderProfileMenu from './HeaderProfileMenu';

type HeaderProps = {
  fixed?: boolean;
};

const HIDDEN_GUEST_ACTION_PATHS = new Set([
  `/${ROUTES.LOGIN}`,
  `/${ROUTES.SIGNUP}`,
  `/${ROUTES.LEGACY_SIGNUP}`,
  `/${ROUTES.AUTH_CALLBACK}`,
  `/${ROUTES.LEGACY_AUTH_CALLBACK}`,
]);

const Header = ({ fixed = true }: HeaderProps) => {
  const location = useLocation();
  const authBootstrapStatus = useAuthStore(
    (state) => state.authBootstrapStatus,
  );
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const account = useAuthStore((state) => state.account);
  const profilePreviewImageUrl = useAuthStore(
    (state) => state.profilePreviewImageUrl,
  );
  const setAccount = useAuthStore((state) => state.setAccount);
  const profileHydrationQuery = useCurrentUserProfileQuery(
    isLoggedIn && !account,
  );
  const shouldHideGuestActions = HIDDEN_GUEST_ACTION_PATHS.has(
    location.pathname,
  );
  const shouldDeferGuestActions =
    !isLoggedIn &&
    !shouldHideGuestActions &&
    authBootstrapStatus !== 'ready' &&
    Boolean(profilePreviewImageUrl);
  const shouldDeferProfileMenu =
    isLoggedIn &&
    !account &&
    (authBootstrapStatus !== 'ready' ||
      profileHydrationQuery.isLoading ||
      profileHydrationQuery.isFetching);
  const resolvedProfileImageUrl =
    account?.profile_img_url ??
    profileHydrationQuery.data?.profile_img_url ??
    profilePreviewImageUrl;
  const shouldShowDeferredGuestPreview =
    shouldDeferGuestActions && Boolean(resolvedProfileImageUrl);

  useEffect(() => {
    if (profileHydrationQuery.data) {
      setAccount(profileHydrationQuery.data);
    }
  }, [profileHydrationQuery.data, setAccount]);

  return (
    <header
      className={`header-shell h-16 w-full lg:h-18 ${
        fixed ? 'fixed top-0 z-50' : 'relative'
      }`}
    >
      <div className="flex h-full w-full items-center justify-between px-[clamp(1rem,5vw,20rem)] py-3">
        <Link
          to="/"
          aria-label="메인 페이지로 이동"
          className="flex h-9 w-18 cursor-pointer items-center justify-center"
        >
          <h1 className="header-logo text-2xl leading-none font-bold lg:text-[26px]">
            PGTI
          </h1>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isLoggedIn ? (
            shouldHideGuestActions ? null : shouldShowDeferredGuestPreview ? (
              resolvedProfileImageUrl ? (
                <div
                  aria-hidden="true"
                  className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/8"
                >
                  <img
                    src={resolvedProfileImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null
            ) : (
              <>
                <Link
                  to={`/${ROUTES.LOGIN}`}
                  className="header-btn-outline flex h-9 w-20 cursor-pointer items-center justify-center rounded-md border px-4 py-1.5 transition-all focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
                >
                  <span className="text-[13px] leading-[150%] font-normal sm:text-sm">
                    로그인
                  </span>
                </Link>
                <Link
                  to={`/${ROUTES.SIGNUP}`}
                  className="header-btn-solid flex h-9 w-22 cursor-pointer items-center justify-center rounded-md border px-4 py-1.5 transition-all focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
                >
                  <span className="text-[13px] leading-[150%] font-normal sm:text-sm">
                    회원가입
                  </span>
                </Link>
              </>
            )
          ) : shouldDeferProfileMenu ? (
            resolvedProfileImageUrl ? (
              <div
                aria-hidden="true"
                className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/8"
              >
                <img
                  src={resolvedProfileImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                aria-hidden="true"
                className="h-10 w-10 rounded-full border-2 border-white/8 bg-white/[0.04]"
              />
            )
          ) : (
            <HeaderProfileMenu profileImageUrl={resolvedProfileImageUrl} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
