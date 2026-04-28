import {
  canToggleDevApiMode,
  configuredApiBaseUrl,
  getCurrentDevApiMode,
  toggleDevApiMode,
} from '../../lib/env';

type DevApiModeToggleProps = {
  variant?: 'floating' | 'compact' | 'fab';
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

  if (isFab) {
    return (
      <button
        type="button"
        onClick={() => toggleDevApiMode(isMockMode ? 'real' : 'mock')}
        className={`support-chat-fab group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none ${className}`}
        aria-label={
          isMockMode
            ? '현재 MSW 사용 중, 클릭하면 실서버로 전환'
            : '현재 실서버 사용 중, 클릭하면 MSW로 전환'
        }
        title={isMockMode ? '현재 MSW 사용 중' : '현재 실서버 사용 중'}
      >
        <span className="support-chat-fab-glow" />
        <span className="relative z-10 text-[10px] font-extrabold tracking-[0.08em]">
          {isMockMode ? 'MSW' : 'REAL'}
        </span>
      </button>
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
