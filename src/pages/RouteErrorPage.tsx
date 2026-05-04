import { Home, RefreshCcw, TriangleAlert } from 'lucide-react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

import { ROUTE_PATHS } from '../constants/routes';

type RouteErrorMetadata = {
  title: string;
  description: string;
  detail?: string | null;
};

const resolveRouteErrorMetadata = (error: unknown): RouteErrorMetadata => {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: '페이지를 찾을 수 없습니다.',
        description:
          '주소가 바뀌었거나 잘못된 경로로 접근했어요. 홈으로 이동해서 다시 시작해 주세요.',
        detail: `${error.status} ${error.statusText}`.trim(),
      };
    }

    return {
      title: '페이지를 불러오지 못했습니다.',
      description:
        '요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      detail: `${error.status} ${error.statusText}`.trim(),
    };
  }

  if (error instanceof Error) {
    return {
      title: '예상치 못한 오류가 발생했습니다.',
      description:
        '화면을 표시하는 중 문제가 생겼습니다. 다시 시도하거나 홈으로 돌아가 주세요.',
      detail: error.message.trim() || null,
    };
  }

  return {
    title: '일시적인 오류가 발생했습니다.',
    description:
      '잠시 후 다시 시도해 주세요. 문제가 계속되면 처음 화면으로 돌아가 다시 진행해 주세요.',
    detail: null,
  };
};

function RouteErrorPage() {
  const error = useRouteError();
  const { title, description, detail } = resolveRouteErrorMetadata(error);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-10 text-white">
      <div className="app-aurora pointer-events-none absolute inset-0 opacity-70" />

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-[32px] border border-white/8 bg-[#111114] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.42)] sm:p-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff6b63]/22 bg-[#ff6b63]/10 text-[#ff8b83] shadow-[0_16px_36px_rgba(223,59,51,0.18)]">
          <TriangleAlert size={24} />
        </div>

        <div className="mt-6">
          <h1 className="text-[clamp(1.75rem,4vw,2.4rem)] font-semibold tracking-[-0.04em] text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm/6 text-white/66 sm:text-base/7">
            {description}
          </p>
          {detail ? (
            <p className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-xs/5 text-white/52 sm:text-sm/6">
              {detail}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#d43a33_0%,#ff6b63_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(223,59,51,0.24)] transition hover:brightness-110 sm:w-auto"
          >
            <RefreshCcw size={16} />
            다시 시도
          </button>
          <Link
            to={ROUTE_PATHS.HOME}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/[0.08] sm:w-auto"
          >
            <Home size={16} />
            홈으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}

export default RouteErrorPage;
