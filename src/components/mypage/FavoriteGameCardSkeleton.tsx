type FavoriteGameCardSkeletonProps = {
  count?: number;
};

function FavoriteGameCardSkeleton({
  count = 4,
}: FavoriteGameCardSkeletonProps) {
  return (
    <div
      className="flex min-w-max items-stretch gap-3 lg:gap-4"
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="border-mypage-card bg-mypage-card box-border h-full w-[11.75rem] min-w-0 shrink-0 overflow-hidden rounded-[22px] border sm:w-[12.75rem] lg:w-[13.75rem] xl:w-[14.25rem]"
        >
          <div className="aspect-3/4 animate-pulse bg-white/8" />
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
