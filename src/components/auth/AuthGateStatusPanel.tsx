type AuthGateStatusPanelProps = {
  title: string;
  description: string;
  align?: 'left' | 'center';
  className?: string;
};

function AuthGateStatusPanel({
  title,
  description,
  align = 'left',
  className = '',
}: AuthGateStatusPanelProps) {
  return (
    <section
      className={`survey-panel max-w-2xl px-6 py-8 sm:px-8 sm:py-10 ${
        align === 'center' ? 'text-center' : ''
      } ${className}`.trim()}
    >
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-4 text-base leading-7 break-keep text-white/60">
        {description}
      </p>
    </section>
  );
}

export default AuthGateStatusPanel;
