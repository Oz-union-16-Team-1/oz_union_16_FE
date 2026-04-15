import { Link, useParams } from 'react-router';

const GameDetailPlaceholder = () => {
  const { gameId } = useParams();

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#050505] px-5 py-16 text-white lg:min-h-[calc(100vh-4.5rem)]">
      <section className="w-full max-w-2xl rounded-lg border border-[#3a0b0d] bg-[#101010] px-6 py-10 text-center shadow-[0_0_36px_rgba(210,11,18,0.18)]">
        <p className="text-sm font-semibold text-[#d20b12]">GAME DETAIL</p>
        <h2 className="mt-4 text-3xl font-bold">상세페이지 준비 중</h2>
        <p className="mt-4 text-base leading-7 text-white/70">
          선택한 게임 상세 정보는 다음 작업에서 연결합니다.
        </p>
        <p className="mt-3 text-sm text-white/50">게임 ID: {gameId ?? 'N/A'}</p>
        <Link
          to="/"
          className="hover:bg-header-accent-hover mt-8 inline-flex h-11 items-center justify-center rounded-md bg-[#d20b12] px-6 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]"
        >
          메인으로 돌아가기
        </Link>
      </section>
    </main>
  );
};

export default GameDetailPlaceholder;
