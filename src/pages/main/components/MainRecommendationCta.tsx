import { Search } from 'lucide-react';
import { Link } from 'react-router';

const CTA_PENDING_MESSAGE = '준비 중입니다.';

type MainRecommendationCtaProps = {
  icon: typeof Search;
  iconLabel: string;
  title: string;
  description: string;
  buttonLabel: string;
  to?: string;
};

const MainRecommendationCta = ({
  icon,
  iconLabel,
  title,
  description,
  buttonLabel,
  to,
}: MainRecommendationCtaProps) => {
  const Icon = icon;
  const actionClassName =
    'hover:bg-header-accent-hover mt-7 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#d20b12] px-7 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d20b12]';

  return (
    <article className="flex min-h-65 flex-col items-center justify-center rounded-lg border border-[#3a0b0d] bg-[#050505] px-6 py-9 text-center sm:min-h-70 lg:min-h-56 lg:px-5 lg:py-7">
      <div
        role="img"
        aria-label={iconLabel}
        className="flex h-16 w-16 items-center justify-center text-[#d20b12] sm:h-18 sm:w-18"
      >
        <Icon aria-hidden="true" className="h-8 w-8 sm:h-9 sm:w-9" />
      </div>
      <h3 className="mt-4 text-2xl leading-tight font-bold sm:text-3xl lg:mt-3 lg:text-[28px]">
        {title}
      </h3>
      <p className="mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base lg:mt-3 lg:text-[15px] lg:leading-6">
        {description}
      </p>
      {to ? (
        <Link to={to} className={`${actionClassName} lg:mt-5`}>
          {buttonLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => window.alert(CTA_PENDING_MESSAGE)}
          title="준비 중입니다."
          className={`${actionClassName} lg:mt-5`}
        >
          {buttonLabel}
        </button>
      )}
    </article>
  );
};

export default MainRecommendationCta;
