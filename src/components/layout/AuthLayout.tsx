import type { ReactNode } from 'react';
import Header from '../common/Header';

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
        className={`text-center text-[clamp(2rem,4.8vw,3rem)] leading-none font-semibold ${titleClassName}`}
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
      <Header fixed={false} />

      <main
        className={`flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${mainClassName}`}
      >
        {withPanel ? (
          <section
            className={`bg-auth-panel border-auth-panel shadow-auth-panel w-full max-w-[520px] rounded-[28px] border px-4 py-5 backdrop-blur-sm sm:rounded-3xl sm:px-8 sm:py-8 ${panelClassName}`}
          >
            <div className={`mx-auto w-full max-w-[440px] ${contentClassName}`}>
              {content}
            </div>
          </section>
        ) : (
          <section className={`w-full max-w-[440px] ${contentClassName}`}>
            {content}
          </section>
        )}
      </main>
    </div>
  );
}

export default AuthLayout;
