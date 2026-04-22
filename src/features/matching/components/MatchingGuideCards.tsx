import { Hand, Heart, Star } from 'lucide-react';

const guideCards = [
  {
    title: '빠르게 비교해 보세요',
    description:
      '장르 안에서 결이 다른 게임을 차례로 보며 지금 끌리는 방향을 가볍게 확인해요.',
    icon: Hand,
  },
  {
    title: '별점으로 취향을 남겨요',
    description: '별점은 추천을 더 정교하게 만드는 선호도 데이터로 반영돼요.',
    icon: Star,
  },
  {
    title: '좋아요로 표시해 둬요',
    description:
      '마음에 든 게임은 하트로 표시해 두고 마이페이지에서 다시 확인할 수 있어요.',
    icon: Heart,
  },
];

function MatchingGuideCards() {
  return (
    <div className="grid gap-2.5 md:grid-cols-3">
      {guideCards.map(({ title, description, icon: Icon }) => (
        <article
          key={title}
          className="rounded-[22px] border border-white/8 bg-white/[0.025] px-4 py-4 shadow-[0_18px_34px_rgba(0,0,0,0.16)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9c1b1b]/35 bg-[#150909] text-[#e34141]">
            <Icon size={18} />
          </div>
          <h2 className="mt-3 text-base font-semibold tracking-[-0.02em] text-white">
            {title}
          </h2>
          <p className="mt-1.5 text-[13px] leading-5 break-keep text-white/58">
            {description}
          </p>
        </article>
      ))}
    </div>
  );
}

export default MatchingGuideCards;
