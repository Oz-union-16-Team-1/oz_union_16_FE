import { Link } from 'react-router-dom';
import profileImg from '../../assets/프로필 이미지.png';

type HeaderProps = {
  isLoggedIn?: boolean;
  fixed?: boolean;
};

const Header = ({ isLoggedIn = false, fixed = true }: HeaderProps) => {
  return (
    <header
      className={`header-shell flex h-28 w-full items-center justify-between px-12 py-8 ${
        fixed ? 'fixed top-0 z-50' : 'relative'
      }`}
    >
      <Link
        to="/"
        aria-label="메인 페이지로 이동"
        className="flex h-12 w-[102px] cursor-pointer items-center justify-center"
      >
        <h1 className="header-logo text-[32px] leading-[150%] font-bold">
          PGTI
        </h1>
      </Link>

      <div className="flex items-center gap-4">
        {!isLoggedIn ? (
          <>
            <button
              type="button"
              className="header-btn-outline flex h-[42px] w-[92px] items-center justify-center rounded-[6px] border px-6 py-2 transition-all"
            >
              <span className="text-base leading-[150%] font-normal">
                로그인
              </span>
            </button>
            <button
              type="button"
              className="header-btn-solid flex h-[42px] w-[106px] items-center justify-center rounded-[6px] border px-6 py-2 transition-all"
            >
              <span className="text-base leading-[150%] font-normal">
                회원가입
              </span>
            </button>
          </>
        ) : (
          <div className="h-[60px] w-[60px] cursor-pointer overflow-hidden rounded-full border-2 border-transparent transition-all hover:border-[var(--color-header-accent)]">
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
