import { ClipboardCheck, Search } from 'lucide-react';
import { useState } from 'react';
import DevApiModeToggle from '../../components/common/DevApiModeToggle';
import LazyHeader from '../../components/common/LazyHeader';
import { ROUTES } from '../../constants/routes';
import GameDetailModal from '../../features/games/components/GameDetailModal';
import type { GameListItem } from '../../features/games/types';
import MainGamesSection from './components/MainGamesSection';
import MainRecommendationCta from './components/MainRecommendationCta';
import { useMainPageGames } from './hooks/useMainPageGames';

const MainPage = () => {
  const mainGamesState = useMainPageGames();
  const [selectedGame, setSelectedGame] = useState<GameListItem | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      <LazyHeader fixed />
      <main className="min-h-screen pt-24 pb-10 text-white sm:pt-28 sm:pb-14 lg:h-screen lg:overflow-hidden lg:pt-24 lg:pb-4 xl:pt-26 xl:pb-5">
        <section className="w-full lg:flex lg:h-full lg:flex-col">
          <MainGamesSection
            {...mainGamesState}
            onSelectGame={setSelectedGame}
          />

          <section className="mt-14 grid gap-6 px-[clamp(1rem,5vw,20rem)] lg:mt-6 lg:grid-cols-2 lg:gap-4 xl:mt-7">
            <MainRecommendationCta
              icon={ClipboardCheck}
              iconLabel="설문 작성"
              title="설문 조사"
              description="설문에 참여하고 나에게 꼭 맞는 게임을 찾아보세요!"
              buttonLabel="설문 시작"
              to={`/${ROUTES.SURVEY}`}
            />
            <MainRecommendationCta
              icon={Search}
              iconLabel="게임 찾기"
              title="장르별 매칭"
              description="어떤 게임을 할지 고민? 당신의 취향에 맞는 게임을 추천해드립니다!"
              buttonLabel="매칭 시작"
              to={`/${ROUTES.MATCHING_LIST}`}
            />
          </section>
        </section>
      </main>

      {selectedGame ? (
        <GameDetailModal
          key={selectedGame.gameId}
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      ) : null}

      <DevApiModeToggle
        variant="fab"
        className="fixed bottom-4 left-4 z-[80] sm:bottom-6 sm:left-6"
      />
    </div>
  );
};

export default MainPage;
