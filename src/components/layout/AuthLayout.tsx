import type { ReactNode } from 'react';
import LazyHeader from '../common/LazyHeader';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  withPanel?: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
  mainClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  children: ReactNode;
};

function AuthLayout({
  title,
  subtitle,
  withPanel = false,
  titleClassName = '',
  subtitleClassName = '',
  mainClassName = '',
  panelClassName = '',
  contentClassName = '',
  children,
}: AuthLayoutProps) {
  const content = (
    <>
      <h1
        className={`text-center text-[clamp(1.8rem,4.3vw,2.65rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-white ${titleClassName}`}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={`text-login-helper mt-2.5 text-center text-sm/5 font-normal sm:mt-3 ${subtitleClassName}`}
        >
          {subtitle}
        </p>
      ) : null}
      {children}
    </>
  );

  return (
    <div className="bg-login-page flex min-h-dvh flex-col text-white">
      <LazyHeader fixed={false} />

      <main
        className={`auth-layout-main relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${mainClassName}`}
      >
        <div aria-hidden="true" className="auth-layout-backdrop" />
        <div aria-hidden="true" className="auth-layout-grid" />

        {withPanel ? (
          <section
            className={`auth-layout-panel w-full max-w-130 rounded-[28px] border px-4 py-5 backdrop-blur-sm sm:rounded-3xl sm:px-8 sm:py-8 ${panelClassName}`}
          >
            <div className={`mx-auto w-full max-w-110 ${contentClassName}`}>
              {content}
            </div>
          </section>
        ) : (
          <section className={`w-full max-w-110 ${contentClassName}`}>
            {content}
          </section>
        )}
      </main>
    </div>
  );
}

export default AuthLayout;
