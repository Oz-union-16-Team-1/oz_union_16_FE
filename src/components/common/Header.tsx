import { Link } from 'react-router';
import { ROUTE_PATHS, ROUTES } from '../../constants/routes';
import useHeaderAuthState from '../../features/auth/hooks/useHeaderAuthState';
import HeaderProfileMenu from './HeaderProfileMenu';

type HeaderProps = {
  fixed?: boolean;
};

const Header = ({ fixed = true }: HeaderProps) => {
  const {
    resolvedProfileImageUrl,
    shouldHideGuestActions,
    shouldShowGuestActions,
    shouldShowDeferredGuestPreview,
    shouldShowGuestPlaceholder,
    shouldShowProfileMenu,
    shouldShowProfilePreview,
    shouldShowProfilePlaceholder,
  } = useHeaderAuthState();
  const profilePreview = resolvedProfileImageUrl ? (
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
  ) : null;
  const profilePlaceholder = (
    <div
      aria-hidden="true"
      className="h-10 w-10 rounded-full border-2 border-white/8 bg-white/4"
    />
  );
  const guestActionsPlaceholder = (
    <div className="h-9 w-44" aria-hidden="true" />
  );

  return (
    <header
      className={`header-shell h-16 w-full lg:h-18 ${
        fixed ? 'fixed top-0 z-50' : 'relative'
      }`}
    >
      <div className="flex h-full w-full items-center justify-between px-[clamp(1rem,5vw,20rem)] py-3">
        <Link
          to={ROUTE_PATHS.HOME}
          aria-label="메인 페이지로 이동"
          className="flex h-9 w-18 cursor-pointer items-center justify-center"
        >
          <h1 className="header-logo text-2xl leading-none font-bold lg:text-[26px]">
            PGTI
          </h1>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {shouldHideGuestActions ? null : shouldShowGuestActions ? (
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
          ) : shouldShowDeferredGuestPreview ? (
            profilePreview
          ) : shouldShowGuestPlaceholder ? (
            guestActionsPlaceholder
          ) : shouldShowProfileMenu ? (
            <HeaderProfileMenu profileImageUrl={resolvedProfileImageUrl} />
          ) : shouldShowProfilePreview ? (
            (profilePreview ?? profilePlaceholder)
          ) : shouldShowProfilePlaceholder ? (
            profilePlaceholder
          ) : (
            guestActionsPlaceholder
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
