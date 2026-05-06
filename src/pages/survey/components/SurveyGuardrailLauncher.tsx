import { createPortal } from 'react-dom';
import { BadgeInfo, X } from 'lucide-react';

type SurveyGuardrailLauncherProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  statusLabel: string;
  keywords: string[];
};

function SurveyGuardrailLauncher({
  isOpen,
  onToggle,
  onClose,
  statusLabel,
  keywords,
}: SurveyGuardrailLauncherProps) {
  if (!import.meta.env.DEV || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed bottom-6 left-2 z-95 hidden lg:block">
      {isOpen ? (
        <aside className="pointer-events-auto mb-3 ml-3 w-75 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,20,0.84),rgba(8,8,9,0.94))] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#ff8a8a] uppercase">
                Dev Guardrail
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                설문 키워드 휴리스틱
              </h3>
            </div>
            <div className="flex items-start gap-2">
              <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] font-medium text-white/64">
                {statusLabel}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/3 text-white/58 transition hover:bg-white/6 hover:text-white"
                aria-label="개발용 가드레일 패널 닫기"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 break-keep text-white/54">
            개발 환경에서만 보이는 설명 패널입니다. 현재 설문은 키워드
            `includes()` 휴리스틱으로 게임 관련 질문 여부를 판정하고, 비게임
            질문 3회 누적 시 5분 제한을 적용합니다.
          </p>

          <div className="mt-3 rounded-[18px] border border-white/8 bg-white/3 px-3 py-3">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/42 uppercase">
              허용 키워드
            </p>
            <div className="mt-2 flex max-h-33 flex-wrap gap-1.5 overflow-y-auto pr-1">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[11px] font-medium text-white/72"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </aside>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(255,53,53,0.94),rgba(130,11,11,0.96))] text-white shadow-[0_18px_40px_rgba(130,0,0,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        aria-label="개발용 설문 키워드 가이드 열기"
      >
        <BadgeInfo size={24} />
      </button>
    </div>,
    document.body,
  );
}

export default SurveyGuardrailLauncher;
