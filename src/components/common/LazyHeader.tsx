import { Suspense, lazy } from 'react';

const Header = lazy(() => import('./Header'));

type LazyHeaderProps = {
  fixed?: boolean;
};

function LazyHeader({ fixed = true }: LazyHeaderProps) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className={`header-shell h-16 w-full lg:h-18 ${
            fixed ? 'fixed top-0 z-50' : 'relative'
          }`}
        />
      }
    >
      <Header fixed={fixed} />
    </Suspense>
  );
}

export default LazyHeader;
