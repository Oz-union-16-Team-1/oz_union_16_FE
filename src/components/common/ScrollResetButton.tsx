import { ArrowLeftToLine } from 'lucide-react';

type ScrollResetButtonProps = {
  isVisible: boolean;
  onClick: () => void;
  label?: string;
};

const ScrollResetButton = ({
  isVisible,
  onClick,
  label = '처음으로',
}: ScrollResetButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`absolute right-3 bottom-[5.8rem] z-30 inline-flex h-10 items-center gap-1.5 rounded-full border border-white/12 bg-black/72 px-3 text-xs font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d20b12] sm:right-4 sm:bottom-[6.2rem] sm:text-sm ${
      isVisible
        ? 'translate-y-0 opacity-100'
        : 'pointer-events-none translate-y-2 opacity-0'
    }`}
  >
    <ArrowLeftToLine
      aria-hidden="true"
      className="h-3.5 w-3.5 text-[#ff5a5f] sm:h-4 sm:w-4"
    />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default ScrollResetButton;
