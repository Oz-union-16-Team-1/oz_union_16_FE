import { ArrowRightLeft } from 'lucide-react';

import {
  canToggleDevApiMode,
  configuredApiBaseUrl,
  getCurrentDevApiMode,
  toggleDevApiMode,
} from '../../lib/env';

type DevApiModeToggleProps = {
  variant?: 'floating' | 'compact' | 'fab' | 'dock';
  className?: string;
};

const resolveBackendLabel = () => {
  if (!configuredApiBaseUrl) {
    return '백엔드 URL 없음';
  }

  try {
    return new URL(configuredApiBaseUrl).host;
  } catch {
    return configuredApiBaseUrl;
  }
};

function DevApiModeToggle({
  variant = 'floating',
  className = '',
}: DevApiModeToggleProps) {
  if (!canToggleDevApiMode) {
    return null;
  }

  const currentMode = getCurrentDevApiMode();
  const isMockMode = currentMode === 'mock';
  const isCompact = variant === 'compact';
  const isFab = variant === 'fab';
  const isDock = variant === 'dock';

  if (isFab || isDock) {
    return (
      <div
        className={`relative flex items-center rounded-full border border-[#ff6b63]/36 bg-[#120b0b]/92 p-1 shadow-[0_22px_48px_rgba(0,0,0,0.42),0_0_28px_rgba(223,59,51,0.24)] backdrop-blur-xl ${
          isDock ? 'h-12 w-[10.75rem]' : 'h-14 w-[12rem]'
        } ${className}`}
        role="group"
        aria-label="개발 API 모드 전환"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_54%)]" />
        <span
          className={`pointer-events-none absolute top-1 left-1 rounded-full border border-[#ff8d84]/42 bg-[linear-gradient(180deg,#ff6b5f_0%,#d92b22_100%)] shadow-[0_14px_30px_rgba(217,43,34,0.32),inset_0_1px_0_rgba(255,255,255,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
            isDock ? 'h-10 w-[4rem]' : 'h-12 w-[4.5rem]'
          }`}
          style={{
            transform: `translateX(${
              isDock ? (isMockMode ? 0 : 98) : isMockMode ? 0 : 112
            }px)`,
          }}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() => {
            if (!isMockMode) {
              toggleDevApiMode('mock');
            }
          }}
          className={`relative z-10 flex h-full cursor-pointer items-center justify-center rounded-full font-extrabold transition-colors duration-300 focus-visible:outline-none motion-reduce:transition-none ${
            isDock
              ? 'w-[4rem] text-[0.72rem] tracking-[0.08em]'
              : 'w-[4.5rem] text-sm tracking-[0.04em]'
          } ${isMockMode ? 'text-white' : 'text-white/58 hover:text-white/82'}`}
          aria-pressed={isMockMode}
          aria-label="MSW 모드로 전환"
          title="MSW 모드"
        >
          <span
            className={
              isMockMode ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.22)]' : ''
            }
          >
            MSW
          </span>
        </button>

        <span
          className={`relative z-10 inline-flex items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
            isDock ? 'h-7 w-7' : 'h-8 w-8'
          }`}
        >
          <ArrowRightLeft size={isDock ? 13 : 15} />
        </span>

        <button
          type="button"
          onClick={() => {
            if (isMockMode) {
              toggleDevApiMode('real');
            }
          }}
          className={`relative z-10 flex h-full cursor-pointer items-center justify-center rounded-full font-extrabold transition-colors duration-300 focus-visible:outline-none motion-reduce:transition-none ${
            isDock
              ? 'w-[4rem] text-[0.72rem] tracking-[0.04em]'
              : 'w-[4.5rem] text-sm tracking-[0.02em]'
          } ${
            !isMockMode ? 'text-white' : 'text-white/58 hover:text-white/82'
          }`}
          aria-pressed={!isMockMode}
          aria-label="실 API 모드로 전환"
          title="실 API 모드"
        >
          <span
            className={
              !isMockMode ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.22)]' : ''
            }
          >
            실 API
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`border border-white/10 bg-black/88 text-white shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-md ${
        isCompact
          ? 'w-[min(12rem,calc(100vw-2rem))] rounded-2xl p-3'
          : 'fixed right-4 bottom-4 z-[70] w-[min(280px,calc(100vw-2rem))] rounded-2xl p-3'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-white/45 uppercase">
            {isCompact ? 'API MODE' : 'Dev API Mode'}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {isMockMode ? '현재 MSW 사용 중' : '현재 실서버 사용 중'}
          </p>
          {!isCompact ? (
            <p className="mt-1 text-xs leading-5 text-white/58">
              전환 시 자동 새로고침됩니다.
            </p>
          ) : null}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isMockMode
              ? 'bg-red-500/16 text-red-200'
              : 'bg-emerald-500/16 text-emerald-200'
          }`}
        >
          {isMockMode ? 'MOCK' : 'REAL'}
        </span>
      </div>

      <div
        className={`${isCompact ? 'mt-2.5' : 'mt-3'} grid grid-cols-2 gap-2`}
      >
        <button
          type="button"
          onClick={() => {
            if (!isMockMode) {
              toggleDevApiMode('mock');
            }
          }}
          className={`cursor-pointer border text-sm font-semibold transition ${
            isMockMode
              ? 'border-red-400/60 bg-red-500/18 text-white'
              : 'border-white/10 bg-white/[0.04] text-white/72 hover:border-white/20 hover:bg-white/[0.08]'
          } ${isCompact ? 'h-9 rounded-xl' : 'h-10 rounded-xl'}`}
        >
          MSW
        </button>
        <button
          type="button"
          onClick={() => {
            if (isMockMode) {
              toggleDevApiMode('real');
            }
          }}
          className={`cursor-pointer border text-sm font-semibold transition ${
            !isMockMode
              ? 'border-emerald-400/60 bg-emerald-500/18 text-white'
              : 'border-white/10 bg-white/[0.04] text-white/72 hover:border-white/20 hover:bg-white/[0.08]'
          } ${isCompact ? 'h-9 rounded-xl' : 'h-10 rounded-xl'}`}
        >
          실서버
        </button>
      </div>

      <div
        className={`${isCompact ? 'mt-2.5 px-2.5 py-2' : 'mt-3 px-3 py-2'} rounded-xl border border-white/6 bg-white/[0.03]`}
      >
        <p className="text-[11px] text-white/42">Configured Backend</p>
        <p className="mt-1 truncate text-xs font-medium text-white/72">
          {resolveBackendLabel()}
        </p>
      </div>
    </aside>
  );
}

export default DevApiModeToggle;
