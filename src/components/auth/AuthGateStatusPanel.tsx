import { LoaderCircle } from 'lucide-react';

type AuthGateStatusPanelProps = {
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  showSpinner?: boolean;
};

function AuthGateStatusPanel({
  title,
  description,
  align = 'left',
  className = '',
  showSpinner = false,
}: AuthGateStatusPanelProps) {
  return (
    <section
      className={`survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10 ${
        align === 'center' ? 'text-center' : ''
      } ${className}`.trim()}
    >
      {showSpinner ? (
        <div
          className={`mb-4 flex ${align === 'center' ? 'justify-center' : 'justify-start'}`}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/72">
            <LoaderCircle size={20} className="animate-spin" />
          </span>
        </div>
      ) : null}
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-7 break-keep text-white/60">
          {description}
        </p>
      ) : null}
    </section>
  );
}

export default AuthGateStatusPanel;
