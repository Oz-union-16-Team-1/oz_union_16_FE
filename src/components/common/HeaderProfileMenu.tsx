import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';

import profileImg from '../../assets/프로필 이미지.png';
import { ROUTES } from '../../constants/routes';
import useLogoutAction from '../../features/auth/hooks/useLogoutAction';

const PROFILE_MENU_ID = 'header-profile-menu';

function HeaderProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { logout, isPending } = useLogoutAction();
  const location = useLocation();
  const isMyPage = location.pathname === `/${ROUTES.MY_PAGE}`;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
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
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={isOpen ? '프로필 메뉴 닫기' : '프로필 메뉴 열기'}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={PROFILE_MENU_ID}
        onClick={() => setIsOpen((current) => !current)}
        className="hover:border-header-accent h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-transparent transition-all focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
      >
        <img
          src={profileImg}
          alt="프로필 이미지"
          className="h-full w-full object-cover"
        />
      </button>

      {isOpen ? (
        <div
          id={PROFILE_MENU_ID}
          role="menu"
          aria-label="프로필 메뉴"
          className="bg-mypage-panel border-mypage-panel shadow-mypage-float absolute top-[calc(100%+0.85rem)] right-0 z-50 w-40 overflow-hidden rounded-2xl border p-2 backdrop-blur-xl"
        >
          <Link
            to={`/${ROUTES.MY_PAGE}`}
            role="menuitem"
            aria-current={isMyPage ? 'page' : undefined}
            onClick={() => setIsOpen(false)}
            className={`flex min-h-12 items-center justify-center rounded-xl px-4 text-base font-medium transition focus-visible:outline-none ${
              isMyPage
                ? 'text-login-primary bg-white/8'
                : 'text-white hover:bg-white/6 focus-visible:bg-white/6'
            }`}
          >
            마이페이지
          </Link>
          <div className="border-mypage-divider mx-2 border-t" />
          <button
            type="button"
            role="menuitem"
            disabled={isPending}
            onClick={() => {
              setIsOpen(false);
              void logout();
            }}
            className="flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-base font-medium text-white transition hover:bg-white/6 focus-visible:bg-white/6 focus-visible:outline-none disabled:opacity-60"
          >
            {isPending ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default HeaderProfileMenu;
