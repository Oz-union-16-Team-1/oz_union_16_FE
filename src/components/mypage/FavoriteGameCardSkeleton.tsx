type FavoriteGameCardSkeletonProps = {
  count?: number;
};

function FavoriteGameCardSkeleton({
  count = 3,
}: FavoriteGameCardSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="border-mypage-card bg-mypage-card box-border h-[21rem] w-full min-w-0 overflow-hidden rounded-[22px] border sm:h-[23rem] xl:h-[24rem]"
        >
          <div className="h-[15.75rem] animate-pulse bg-white/8 sm:h-[17.4rem] xl:h-[18.5rem]" />
          <div className="space-y-2 px-4 py-3">
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
