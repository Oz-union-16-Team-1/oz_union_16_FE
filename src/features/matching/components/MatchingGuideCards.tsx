import { Hand, Heart, Star } from 'lucide-react';

const guideCards = [
  {
    title: '카드를 넘겨보세요',
    description:
      '현재 게임의 분위기와 취향이 맞는지 보면서 차례대로 평가를 진행해요.',
    icon: Hand,
  },
  {
    title: '별점을 남겨보세요',
    description:
      '마음에 드는 정도를 별점으로 표현하면 다음 단계 추천 정확도가 높아져요.',
    icon: Star,
  },
  {
    title: '게임을 모아보세요',
    description:
      '좋아 보이는 게임은 하트로 표시해두고 나중에 다시 살펴볼 수 있어요.',
    icon: Heart,
  },
];

function MatchingGuideCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {guideCards.map(({ title, description, icon: Icon }) => (
        <article
          key={title}
          className="rounded-[22px] border border-white/8 bg-white/[0.025] px-4 py-5 shadow-[0_18px_34px_rgba(0,0,0,0.16)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9c1b1b]/35 bg-[#150909] text-[#e34141]">
            <Icon size={18} />
          </div>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-white">
            {title}
          </h2>
          <p className="mt-2 text-[13px] leading-5 break-keep text-white/58">
            {description}
          </p>
        </article>
      ))}
    </div>
  );
}

export default MatchingGuideCards;
