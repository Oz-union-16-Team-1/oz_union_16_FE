import { LoaderCircle } from 'lucide-react';

type CenteredLoadingStateProps = {
  title: string;
  hint?: string;
  label?: string;
  className?: string;
};

function CenteredLoadingState({
  title,
  hint,
  label = 'Loading',
  className = '',
}: CenteredLoadingStateProps) {
  return (
    <section
      className={`flex min-h-[min(54vh,30rem)] items-center justify-center ${className}`.trim()}
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,20,0.92),rgba(9,9,10,0.98))] px-7 py-9 text-center shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:px-9 sm:py-10">
        <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)]" />

        <div className="inline-flex items-center rounded-full border border-[#7c2626]/35 bg-[#180909]/55 px-3 py-1 text-[10px] font-semibold tracking-[0.26em] text-white/52 uppercase">
          {label}
        </div>

        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#8d2c2c]/35 bg-[radial-gradient(circle_at_30%_30%,rgba(255,120,120,0.18),rgba(255,255,255,0.03))] text-[#f1b8b8] shadow-[0_0_0_8px_rgba(255,255,255,0.02)]">
          <LoaderCircle size={26} className="animate-spin" />
        </div>

        <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.03em] break-keep text-white sm:text-[30px]">
          {title}
        </h2>

        {hint ? (
          <p className="mt-3 text-sm leading-6 break-keep text-white/46 sm:text-[15px]">
            {hint}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/25 [animation-delay:240ms]" />
        </div>
      </div>
    </section>
  );
}

export default CenteredLoadingState;
