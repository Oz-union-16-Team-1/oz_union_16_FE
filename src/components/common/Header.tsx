import { Link } from 'react-router';
import profileImg from '../../assets/프로필 이미지.png';

type HeaderProps = {
  isLoggedIn?: boolean;
  fixed?: boolean;
};

const Header = ({ isLoggedIn = false, fixed = true }: HeaderProps) => {
  return (
    <header
      className={`header-shell flex h-20 w-full items-center justify-between px-4 py-4 sm:h-24 sm:px-6 sm:py-6 md:h-28 md:px-12 md:py-8 ${
        fixed ? 'fixed top-0 z-50' : 'relative'
      }`}
    >
      <Link
        to="/"
        aria-label="메인 페이지로 이동"
        className="flex h-10 w-[88px] cursor-pointer items-center justify-center sm:h-11 sm:w-[96px] md:h-12 md:w-[102px]"
      >
        <h1 className="header-logo text-[26px] leading-[150%] font-bold sm:text-[30px] md:text-[32px]">
          PGTI
        </h1>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {!isLoggedIn ? (
          <>
            <button
              type="button"
              className="header-btn-outline flex h-10 min-w-[72px] items-center justify-center rounded-[6px] border px-3 py-2 text-sm transition-all sm:h-[42px] sm:min-w-[88px] sm:px-5 sm:text-base md:min-w-[92px] md:px-6"
            >
              <span className="leading-[150%] font-normal">로그인</span>
            </button>
            <button
              type="button"
              className="header-btn-solid flex h-10 min-w-[84px] items-center justify-center rounded-[6px] border px-3 py-2 text-sm transition-all sm:h-[42px] sm:min-w-[100px] sm:px-5 sm:text-base md:min-w-[106px] md:px-6"
            >
              <span className="leading-[150%] font-normal">회원가입</span>
            </button>
          </>
        ) : (
          <div className="h-11 w-11 cursor-pointer overflow-hidden rounded-full border-2 border-transparent transition-all hover:border-[var(--color-header-accent)] sm:h-[52px] sm:w-[52px] md:h-[60px] md:w-[60px]">
            <img
              src={profileImg}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
