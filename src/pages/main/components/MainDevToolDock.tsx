import { ArrowRightLeft, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import DevApiModeToggle from '../../../components/common/DevApiModeToggle';
import {
  canToggleDevApiMode,
  isMockServiceWorkerEnabled,
} from '../../../lib/env';

const DEV_TOOL_DOCK_CLASS_NAME =
  'fixed left-4 bottom-4 z-[95] sm:left-6 sm:bottom-6';
const DEV_API_BUTTON_CLASS_NAME =
  'support-chat-fab group relative flex h-14 w-14 items-center justify-center rounded-full border border-[#ff7068]/48 bg-[linear-gradient(180deg,#ff6e66_0%,#d92b22_100%)] text-white shadow-[0_22px_48px_rgba(0,0,0,0.45),0_0_28px_rgba(223,59,51,0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none';
const DEV_API_PANEL_CLASS_NAME =
  'support-chat-panel absolute bottom-[calc(100%+0.75rem)] left-0 flex w-[min(92vw,19rem)] origin-bottom-left flex-col overflow-hidden rounded-[1.6rem] border border-[#ff6b63]/20 bg-[linear-gradient(180deg,rgba(20,13,13,0.98)_0%,rgba(10,8,8,0.96)_100%)] shadow-[0_28px_60px_rgba(0,0,0,0.48),0_0_36px_rgba(223,59,51,0.16)] backdrop-blur-xl transition-all duration-300 ease-out';

function MainDevToolDock() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const isMockMode = isMockServiceWorkerEnabled();

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPanelOpen(false);
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('.main-dev-api-fab')
      ) {
        setIsPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPanelOpen]);

  if (!canToggleDevApiMode) {
    return null;
  }

  return (
    <div className={DEV_TOOL_DOCK_CLASS_NAME}>
      <div className="relative">
        <div
          ref={panelRef}
          className={`${DEV_API_PANEL_CLASS_NAME} ${
            isPanelOpen
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-4 scale-95 opacity-0'
          }`}
          role="dialog"
          aria-modal="false"
          aria-label="개발용 API 전환 패널"
        >
          <div className="border-b border-white/8 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">API 전환</p>
                <p className="mt-1 text-xs/5 text-white/55">
                  {isMockMode
                    ? '현재 MSW 모드예요. 전환하면 바로 새로고침됩니다.'
                    : '현재 실 API 모드예요. 전환하면 바로 새로고침됩니다.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="support-chat-icon-btn"
                aria-label="개발용 API 전환 패널 닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="px-4 py-4">
            <DevApiModeToggle variant="dock" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPanelOpen((previous) => !previous)}
          className={`${DEV_API_BUTTON_CLASS_NAME} main-dev-api-fab`}
          aria-label={
            isPanelOpen
              ? '개발용 API 전환 패널 닫기'
              : '개발용 API 전환 패널 열기'
          }
        >
          <span className="support-chat-fab-glow" />
          <ArrowRightLeft
            size={21}
            className={`relative z-10 transition-transform ${
              isPanelOpen ? 'scale-95 -rotate-6' : 'scale-100'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default MainDevToolDock;
