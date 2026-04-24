type FavoriteGameCardSkeletonProps = {
  count?: number;
};

function FavoriteGameCardSkeleton({
  count = 8,
}: FavoriteGameCardSkeletonProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4"
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="border-mypage-card bg-mypage-card overflow-hidden rounded-[22px] border"
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
