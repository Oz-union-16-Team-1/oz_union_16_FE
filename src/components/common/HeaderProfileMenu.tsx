import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';

import profileImg from '../../assets/프로필 이미지.png';
import { isMyPagePath } from '../../constants/routeResolver';
import { ROUTE_PATHS } from '../../constants/routes';
import useLogoutAction from '../../features/auth/hooks/useLogoutAction';

const PROFILE_MENU_ID = 'header-profile-menu';

type HeaderProfileMenuProps = {
  profileImageUrl?: string | null;
};

type ProfileMenuOpenState = {
  hover: boolean;
  click: boolean;
};

const closedProfileMenuState: ProfileMenuOpenState = {
  hover: false,
  click: false,
};

function HeaderProfileMenu({ profileImageUrl = null }: HeaderProfileMenuProps) {
  const [openState, setOpenState] = useState<ProfileMenuOpenState>(
    closedProfileMenuState,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const { logout, isPending } = useLogoutAction();
  const location = useLocation();
  const isMyPage = isMyPagePath(location.pathname);
  const trimmedProfileImageUrl = profileImageUrl?.trim() || null;
  const resolvedProfileImageUrl = trimmedProfileImageUrl || profileImg;
  const isOpen = openState.hover || openState.click;
  const profileButtonClass = `h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none ${
    isOpen
      ? 'border-[#ff3b30] shadow-[0_0_0_4px_rgba(255,59,48,0.16)]'
      : 'border-white/14 hover:border-[#ff3b30] hover:shadow-[0_0_0_4px_rgba(255,59,48,0.12)]'
  }`;
  const closeMenu = () => {
    setOpenState(closedProfileMenuState);
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() =>
        setOpenState((current) => ({ ...current, hover: true }))
      }
      onMouseLeave={() =>
        setOpenState((current) => ({ ...current, hover: false }))
      }
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          closeMenu();
        }
      }}
    >
      <button
        type="button"
        aria-label={isOpen ? '프로필 메뉴 닫기' : '프로필 메뉴 열기'}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? PROFILE_MENU_ID : undefined}
        onClick={() =>
          setOpenState((current) => ({ ...current, click: !current.click }))
        }
        className={profileButtonClass}
      >
        <img
          src={resolvedProfileImageUrl}
          alt="프로필 이미지"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = profileImg;
          }}
        />
      </button>

      {isOpen ? (
        <div className="pointer-events-auto absolute top-full right-0 z-50 translate-y-0 pt-3 opacity-100 transition-all duration-200 ease-out">
          <div
            id={PROFILE_MENU_ID}
            role="menu"
            aria-label="프로필 메뉴"
            className="w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#101013]/96 p-2 shadow-[0_24px_48px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-white/5 backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out"
          >
            <Link
              to={ROUTE_PATHS.MY_PAGE}
              role="menuitem"
              aria-current={isMyPage ? 'page' : undefined}
              onClick={closeMenu}
              className={`flex min-h-12 items-center justify-center rounded-xl px-4 text-base font-medium transition focus-visible:outline-none ${
                isMyPage
                  ? 'text-login-primary bg-white/8'
                  : 'text-white hover:bg-white/6 focus-visible:bg-white/6'
              }`}
            >
              마이페이지
            </Link>
            <div className="mx-2 border-t border-white/10" />
            <button
              type="button"
              role="menuitem"
              disabled={isPending}
              onClick={() => {
                closeMenu();
                void logout();
              }}
              className="flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-base font-medium text-white transition hover:bg-white/6 focus-visible:bg-white/6 focus-visible:outline-none disabled:opacity-60"
            >
              {isPending ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default HeaderProfileMenu;
