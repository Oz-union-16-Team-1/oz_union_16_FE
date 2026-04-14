import type { ReactNode } from 'react';
import Header from '../common/Header';

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="bg-login-page flex min-h-screen flex-col text-white">
      <Header fixed={false} />

      <main className="flex flex-1 items-start justify-center px-6 pt-8 pb-16 sm:px-8 sm:pt-12">
        <section className="w-full max-w-[440px]">
          <h1 className="text-center text-[34px] leading-none font-semibold sm:text-[46px]">
            {title}
          </h1>
          {children}
        </section>
      </main>
    </div>
  );
}

export default AuthLayout;
