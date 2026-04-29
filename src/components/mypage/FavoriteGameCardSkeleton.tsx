type FavoriteGameCardSkeletonProps = {
  count?: number;
};

function FavoriteGameCardSkeleton({
  count = 4,
}: FavoriteGameCardSkeletonProps) {
  return (
    <div
      className="grid grid-cols-4 gap-2 sm:gap-3"
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="border-mypage-card bg-mypage-card box-border h-[22rem] w-full min-w-0 overflow-hidden rounded-[22px] border sm:h-[24rem] lg:h-[25rem]"
        >
          <div className="h-[15rem] animate-pulse bg-white/8 sm:h-[16.5rem] lg:h-[17.5rem]" />
          <div className="space-y-2 px-4 py-4">
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/8" />
          </div>
        </article>
      ))}
    </div>
  );
}

export default FavoriteGameCardSkeleton;
