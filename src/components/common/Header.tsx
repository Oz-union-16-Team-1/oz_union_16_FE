import profileImg from '../../assets/프로필 이미지.png';

type HeaderProps = {
  isLoggedIn?: boolean;
  fixed?: boolean;
};

const Header = ({ isLoggedIn = false, fixed = true }: HeaderProps) => {
  return (
    <header
      className={`flex h-28 w-full items-center justify-between bg-black px-12 py-8 shadow-[0_0_32px_rgba(255,255,255,0.14),0_0_18px_rgba(0,0,0,0.32)] ${
        fixed ? 'fixed top-0 z-50' : 'relative'
      }`}
    >
      <div className="flex h-12 w-[102px] cursor-pointer items-center justify-center">
        <h1 className="text-[32px] leading-[150%] font-bold text-[#C81010]">
          PGTI
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {!isLoggedIn ? (
          <>
            <button
              type="button"
              className="flex h-[42px] w-[92px] items-center justify-center rounded-[6px] border border-white px-6 py-2 transition-all hover:bg-white/10"
            >
              <span className="text-base leading-[150%] font-normal text-white">
                로그인
              </span>
            </button>
            <button
              type="button"
              className="flex h-[42px] w-[106px] items-center justify-center rounded-[6px] border border-[#1A1A1A] bg-[#C81010] px-6 py-2 transition-all hover:bg-[#A60D0D]"
            >
              <span className="text-base leading-[150%] font-normal text-white">
                회원가입
              </span>
            </button>
          </>
        ) : (
          <div className="h-[60px] w-[60px] cursor-pointer overflow-hidden rounded-full border-2 border-transparent transition-all hover:border-[#C81010]">
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
