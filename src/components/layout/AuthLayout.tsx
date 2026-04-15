import type { ReactNode } from 'react';
import Header from '../common/Header';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  withPanel?: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
  panelClassName?: string;
  children: ReactNode;
};

function AuthLayout({
  title,
  subtitle,
  withPanel = false,
  titleClassName = '',
  subtitleClassName = '',
  panelClassName = '',
  children,
}: AuthLayoutProps) {
  const content = (
    <>
      <h1
        className={`text-center text-4xl leading-none font-semibold sm:text-5xl ${titleClassName}`}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={`text-login-helper mt-3 text-center text-sm/5 font-normal ${subtitleClassName}`}
        >
          {subtitle}
        </p>
      ) : null}
      {children}
    </>
  );

  return (
    <div className="bg-login-page flex min-h-screen flex-col text-white">
      <Header fixed={false} />

      <main className="flex flex-1 items-start justify-center px-6 pt-8 pb-16 sm:px-8 sm:pt-12">
        {withPanel ? (
          <section
            className={`bg-auth-panel border-auth-panel shadow-auth-panel w-full max-w-[520px] rounded-3xl border px-5 py-6 backdrop-blur-sm sm:px-8 sm:py-8 ${panelClassName}`}
          >
            <div className="mx-auto w-full max-w-[440px]">{content}</div>
          </section>
        ) : (
          <section className="w-full max-w-[440px]">{content}</section>
        )}
      </main>
    </div>
  );
}

export default AuthLayout;
