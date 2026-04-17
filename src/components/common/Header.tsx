import { Link } from 'react-router';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/useAuthStore';
import HeaderProfileMenu from './HeaderProfileMenu';

type HeaderProps = {
  fixed?: boolean;
};

const Header = ({ fixed = true }: HeaderProps) => {
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken));

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
          ) : (
            <HeaderProfileMenu />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
